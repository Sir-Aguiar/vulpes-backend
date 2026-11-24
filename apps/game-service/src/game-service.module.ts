import { Module } from '@nestjs/common';
import { MessagingModule } from '../../../libs/messaging/src';
import { GameServiceController } from './game-service.controller';
import { GameServiceService } from './game-service.service';

@Module({
  imports: [
    MessagingModule.register({
      url: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
      consumers: ['ping'],
    }),
  ],
  controllers: [GameServiceController],
  providers: [GameServiceService],
})
export class GameServiceModule {}
