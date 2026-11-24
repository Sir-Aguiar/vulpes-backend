import { Injectable } from '@nestjs/common';
import { type ConsumeMessage } from 'amqplib';
import { randomUUID } from 'node:crypto';
import { RabbitmqConnection } from '../connection/rabbitmq.connection';

export type RpcRequest<T> = {
  exchange: string;
  routingKey: string;
  payload: unknown;
  timeoutMs: number;
  timeoutMessage: string;
  parse: (message: ConsumeMessage) => T;
};

@Injectable()
export class Publisher {
  constructor(private readonly connection: RabbitmqConnection) {}

  async publish(
    exchange: string,
    routingKey: string,
    payload: unknown,
  ): Promise<void> {
    const channel = await this.connection.getChannel();
    const published = channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { contentType: 'application/json' },
    );

    if (!published) {
      throw new Error('Não foi possível publicar a mensagem no RabbitMQ.');
    }
  }

  async rpc<T>(request: RpcRequest<T>): Promise<T> {
    const channel = await this.connection.getChannel();
    const { queue } = await channel.assertQueue('', {
      exclusive: true,
      autoDelete: true,
    });
    const correlationId = randomUUID();

    return new Promise<T>((resolve, reject) => {
      let settled = false;
      let consumerTag: string | undefined;

      const finish = (callback: () => void) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        if (consumerTag) {
          void channel.cancel(consumerTag).catch(() => undefined);
        }
        callback();
      };

      const timer = setTimeout(() => {
        finish(() => reject(new Error(request.timeoutMessage)));
      }, request.timeoutMs);

      channel
        .consume(
          queue,
          (message) => {
            if (!message || message.properties.correlationId !== correlationId) {
              if (message) {
                channel.ack(message);
              }
              return;
            }

            let body: T;
            try {
              body = request.parse(message);
            } catch (error) {
              finish(() =>
                reject(error instanceof Error ? error : new Error('Resposta inválida.')),
              );
              channel.ack(message);
              return;
            }

            finish(() => {
              channel.ack(message);
              resolve(body);
            });
          },
          { noAck: false },
        )
        .then(({ consumerTag: tag }) => {
          consumerTag = tag;
          if (settled) {
            void channel.cancel(tag).catch(() => undefined);
            return;
          }

          const published = channel.publish(
            request.exchange,
            request.routingKey,
            Buffer.from(JSON.stringify(request.payload)),
            {
              correlationId,
              replyTo: queue,
              contentType: 'application/json',
            },
          );

          if (!published) {
            finish(() =>
              reject(new Error('Não foi possível publicar a mensagem no RabbitMQ.')),
            );
          }
        })
        .catch((error: Error) => finish(() => reject(error)));
    });
  }
}
