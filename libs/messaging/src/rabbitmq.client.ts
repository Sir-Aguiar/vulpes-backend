import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { connect, type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib';
import { randomUUID } from 'node:crypto';
import {
  PING_EXCHANGE,
  PING_QUEUE,
  PING_ROUTING_KEY,
  PING_TIMEOUT_MS,
  type PingMessage,
  type PongMessage,
} from './ping.contract';
import { RABBITMQ_OPTIONS, type RabbitmqOptions } from './rabbitmq.options';

@Injectable()
export class RabbitmqClient implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqClient.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private connecting: Promise<void> | null = null;
  private consuming = false;

  constructor(
    @Inject(RABBITMQ_OPTIONS) private readonly options: RabbitmqOptions,
  ) {}

  async ping(timeoutMs = PING_TIMEOUT_MS): Promise<PongMessage> {
    const channel = await this.ensureChannel();
    const { queue } = await channel.assertQueue('', {
      exclusive: true,
      autoDelete: true,
    });
    const correlationId = randomUUID();
    const sentAt = new Date().toISOString();
    const payload: PingMessage = { type: 'ping', sentAt };

    return new Promise<PongMessage>((resolve, reject) => {
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
        finish(() =>
          reject(
            new Error(
              `game-service não respondeu ao ping em ${timeoutMs}ms. Confirme que ele está no ar.`,
            ),
          ),
        );
      }, timeoutMs);

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

            let pong: PongMessage;
            try {
              pong = this.readPong(message);
            } catch (error) {
              finish(() =>
                reject(
                  error instanceof Error
                    ? error
                    : new Error('Resposta do game-service não é um pong.'),
                ),
              );
              channel.ack(message);
              return;
            }

            finish(() => {
              channel.ack(message);
              resolve(pong);
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
            PING_EXCHANGE,
            PING_ROUTING_KEY,
            Buffer.from(JSON.stringify(payload)),
            {
              correlationId,
              replyTo: queue,
              contentType: 'application/json',
            },
          );

          if (!published) {
            finish(() =>
              reject(new Error('Não foi possível publicar o ping no RabbitMQ.')),
            );
          }
        })
        .catch((error: Error) => finish(() => reject(error)));
    });
  }

  async consumePings(): Promise<void> {
    if (this.consuming) {
      return;
    }

    const channel = await this.ensureChannel();
    await channel.prefetch(1);
    await channel.consume(PING_QUEUE, (message) => {
      if (!message) {
        return;
      }
      this.replyToPing(channel, message);
    });
    this.consuming = true;
    this.logger.log(`Consumindo a fila ${PING_QUEUE}`);
  }

  async onModuleDestroy(): Promise<void> {
    this.consuming = false;
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      this.connection = null;
      this.channel = null;
    }
  }

  private async ensureChannel(): Promise<Channel> {
    if (this.channel) {
      return this.channel;
    }

    if (!this.connecting) {
      this.connecting = this.open().finally(() => {
        this.connecting = null;
      });
    }

    await this.connecting;

    if (!this.channel) {
      throw new Error(`RabbitMQ indisponível em ${this.options.url}.`);
    }

    return this.channel;
  }

  private async open(): Promise<void> {
    try {
      const connection = await connect(this.options.url);
      connection.on('error', (error: Error) => {
        this.logger.error(`RabbitMQ: ${error.message}`);
      });
      connection.on('close', () => {
        this.connection = null;
        this.channel = null;
        this.consuming = false;
      });

      const channel = await connection.createChannel();
      await channel.assertExchange(PING_EXCHANGE, 'direct', { durable: true });
      await channel.assertQueue(PING_QUEUE, { durable: true });
      await channel.bindQueue(PING_QUEUE, PING_EXCHANGE, PING_ROUTING_KEY);

      this.connection = connection;
      this.channel = channel;
      this.logger.log('RabbitMQ conectado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'falha de conexão';
      throw new Error(`RabbitMQ indisponível em ${this.options.url}: ${message}`);
    }
  }

  private replyToPing(channel: Channel, message: ConsumeMessage): void {
    const replyTo = message.properties.replyTo;
    const correlationId = message.properties.correlationId;

    try {
      const body = JSON.parse(message.content.toString()) as Partial<PingMessage>;
      if (body.type !== 'ping' || !replyTo) {
        this.logger.warn('Mensagem ignorada na fila de ping');
        channel.ack(message);
        return;
      }

      const pong: PongMessage = {
        type: 'pong',
        sentAt: body.sentAt ?? new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      };

      channel.sendToQueue(replyTo, Buffer.from(JSON.stringify(pong)), {
        correlationId,
        contentType: 'application/json',
      });
      channel.ack(message);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'payload inválido';
      this.logger.error(`Falha ao responder o ping: ${detail}`);
      channel.ack(message);
    }
  }

  private readPong(message: ConsumeMessage): PongMessage {
    const body = JSON.parse(message.content.toString()) as Partial<PongMessage>;
    if (body.type !== 'pong' || !body.sentAt || !body.receivedAt) {
      throw new Error('Resposta do game-service não é um pong.');
    }

    return {
      type: 'pong',
      sentAt: body.sentAt,
      receivedAt: body.receivedAt,
    };
  }
}
