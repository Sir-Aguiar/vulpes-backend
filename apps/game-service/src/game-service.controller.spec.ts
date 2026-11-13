import { Test, TestingModule } from '@nestjs/testing';
import { GameServiceController } from './game-service.controller';
import { GameServiceService } from './game-service.service';

describe('GameServiceController', () => {
  let gameServiceController: GameServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [GameServiceController],
      providers: [GameServiceService],
    }).compile();

    gameServiceController = app.get<GameServiceController>(GameServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(gameServiceController.getHello()).toBe('Hello World!');
    });
  });
});
