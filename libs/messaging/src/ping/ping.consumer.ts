import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { type Channel, type ConsumeMessage } from 'amqplib';
import { RabbitmqConnection } from '../connection/rabbitmq.connection';
import {
  PING_QUEUE,
  type PingMessage,
  type PongMessage,
} from '../contracts/ping.contract';
import { RABBITMQ_OPTIONS, type RabbitmqOptions } from '../rabbitmq.options';
import { Consumer } from '../transport/consumer';
import { assertPingTopology } from './ping.topology';

@Injectable()
export class PingConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PingConsumer.name);
  private retry: NodeJS.Timeout | null = null;

  constructor(
    private readonly connection: RabbitmqConnection,
    private readonly consumer: Consumer,
    @Inject(RABBITMQ_OPTIONS) private readonly options: RabbitmqOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.options.consumers.includes('ping')) {
      return;
    }

    await this.listen();
  }

  onModuleDestroy(): void {
    if (this.retry) {
      clearTimeout(this.retry);
    }
  }

  private async listen(): Promise<void> {
    try {
      const channel = await this.connection.getChannel();
      await assertPingTopology(channel);
      await this.consumer.consume(PING_QUEUE, (message, openChannel) => {
        this.reply(openChannel, message);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'falha ao consumir';
      this.logger.error(`${message} Nova tentativa em 5s.`);
      this.retry = setTimeout(() => {
        void this.listen();
      }, 5000);
      this.retry.unref();
    }
  }

  private reply(channel: Channel, message: ConsumeMessage): void {
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
}
