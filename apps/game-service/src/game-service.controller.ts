import { Controller, Get } from '@nestjs/common';
import { GameServiceService } from './game-service.service';

@Controller()
export class GameServiceController {
  constructor(private readonly gameServiceService: GameServiceService) {}

  @Get()
  getHello(): string {
    return this.gameServiceService.getHello();
  }
}
