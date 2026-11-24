import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { connect, type Channel, type ChannelModel } from 'amqplib';
import { RABBITMQ_OPTIONS, type RabbitmqOptions } from '../rabbitmq.options';

@Injectable()
export class RabbitmqConnection implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqConnection.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private connecting: Promise<void> | null = null;
  private readonly onDisconnected = new Set<() => void>();

  constructor(
    @Inject(RABBITMQ_OPTIONS) private readonly options: RabbitmqOptions,
  ) {}

  whenDisconnected(listener: () => void): void {
    this.onDisconnected.add(listener);
  }

  async getChannel(): Promise<Channel> {
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

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      this.connection = null;
      this.channel = null;
    }
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
        for (const listener of this.onDisconnected) {
          listener();
        }
      });

      const channel = await connection.createChannel();
      this.connection = connection;
      this.channel = channel;
      this.logger.log('RabbitMQ conectado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'falha de conexão';
      throw new Error(`RabbitMQ indisponível em ${this.options.url}: ${message}`);
    }
  }
}
