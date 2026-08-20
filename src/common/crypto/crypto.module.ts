import { Module } from '@nestjs/common';
import { RedisModule } from '../../infra/redis/redis.module';
import { EncryptedBodyMiddleware } from './encrypted-body.middleware';
import { EncryptedBodyService } from './encrypted-body.service';

@Module({
  imports: [RedisModule],
  providers: [EncryptedBodyService, EncryptedBodyMiddleware],
  exports: [EncryptedBodyService, EncryptedBodyMiddleware],
})
export class CryptoModule {}
