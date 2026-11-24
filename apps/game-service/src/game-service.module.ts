import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { MessagingModule } from '../../../libs/messaging/src';
import { ConfigModule } from './config/config.module';
import { EnvService } from './config/env.service';
import { GameServiceController } from './game-service.controller';
import { GameServiceService } from './game-service.service';
import { FirestoreModule } from './infra/firestore/firestore.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule,
    FirestoreModule,
    UserModule,
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
  providers: [
    GameServiceService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class GameServiceModule {}
