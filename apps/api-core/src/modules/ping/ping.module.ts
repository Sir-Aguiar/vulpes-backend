import { Module } from '@nestjs/common';
import { MessagingModule } from '../../../../../libs/messaging/src';
import { ConfigModule } from '../../config/config.module';
import { EnvService } from '../../config/env.service';
import { PingController } from './ping.controller';

@Module({
  imports: [
    MessagingModule.registerAsync({
      imports: [ConfigModule],
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        url: env.get('RABBITMQ_URL'),
        consumers: [],
      }),
    }),
  ],
  controllers: [PingController],
})
export class PingModule {}
