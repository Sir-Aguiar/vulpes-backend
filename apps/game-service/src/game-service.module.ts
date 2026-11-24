import { Module } from '@nestjs/common';
import { MessagingModule } from '../../../libs/messaging/src';
import { ConfigModule } from './config/config.module';
import { EnvService } from './config/env.service';
import { GameServiceController } from './game-service.controller';
import { GameServiceService } from './game-service.service';
import { FirestoreModule } from './infra/firestore/firestore.module';

@Module({
  imports: [
    ConfigModule,
    FirestoreModule,
    MessagingModule.registerAsync({
      imports: [ConfigModule],
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        url: env.get('RABBITMQ_URL'),
        consumers: ['ping'],
      }),
    }),
  ],
  controllers: [GameServiceController],
  providers: [GameServiceService],
})
export class GameServiceModule {}
