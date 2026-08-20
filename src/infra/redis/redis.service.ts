import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { EnvService } from '../../config/env.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private loggedConnectionError = false;

  constructor(env: EnvService) {
    this.client = new Redis(env.get('REDIS_URL'), {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
    });

    this.client.on('error', () => {
      if (this.loggedConnectionError) {
        return;
      }
      this.loggedConnectionError = true;
      this.logger.error(
        `Redis indisponível em ${env.get('REDIS_URL')}. Suba o serviço (ex.: docker compose up -d redis).`,
      );
    });

    this.client.on('ready', () => {
      this.loggedConnectionError = false;
      this.logger.log('Redis connected');
    });
  }

  /**
   * Grava `key` só se ela ainda não existir (`NX`) e aplica TTL em segundos.
   * Retorna `true` quando a chave foi criada; `false` se já existia (replay).
   */
  async setIfNotExists(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}
