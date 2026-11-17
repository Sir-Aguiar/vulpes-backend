import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RabbitmqClient } from './rabbitmq.client';
import { RABBITMQ_OPTIONS, type RabbitmqOptions } from './rabbitmq.options';

@Injectable()
export class PingListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PingListener.name);
  private retry: NodeJS.Timeout | null = null;

  constructor(
    private readonly client: RabbitmqClient,
    @Inject(RABBITMQ_OPTIONS) private readonly options: RabbitmqOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.options.consumePings) {
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
      await this.client.consumePings();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'falha ao consumir';
      this.logger.error(`${message} Nova tentativa em 5s.`);
      this.retry = setTimeout(() => {
        void this.listen();
      }, 5000);
      this.retry.unref();
    }
  }
}
