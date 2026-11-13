import { Module } from '@nestjs/common';
import { GameServiceController } from './game-service.controller';
import { GameServiceService } from './game-service.service';

@Module({
  imports: [],
  controllers: [GameServiceController],
  providers: [GameServiceService],
})
export class GameServiceModule {}
