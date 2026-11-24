import { Injectable, Logger } from '@nestjs/common';
import { type Channel, type ConsumeMessage } from 'amqplib';
import { RabbitmqConnection } from '../connection/rabbitmq.connection';

@Injectable()
export class Consumer {
  private readonly logger = new Logger(Consumer.name);
  private readonly queues = new Set<string>();

  constructor(private readonly connection: RabbitmqConnection) {
    this.connection.whenDisconnected(() => {
      this.queues.clear();
    });
  }

  async consume(
    queue: string,
    handler: (message: ConsumeMessage, channel: Channel) => void,
  ): Promise<void> {
    if (this.queues.has(queue)) {
      return;
    }

    const channel = await this.connection.getChannel();
    await channel.prefetch(1);
    await channel.consume(queue, (message) => {
      if (!message) {
        return;
      }
      handler(message, channel);
    });
    this.queues.add(queue);
    this.logger.log(`Consumindo a fila ${queue}`);
  }

  reset(): void {
    this.queues.clear();
  }
}
