import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { EnvService } from './config/env.service';
import { GameServiceModule } from './game-service.module';

async function bootstrap() {
  const app = await NestFactory.create(GameServiceModule);
  const env = app.get(EnvService);
  const port = env.get('GAME_SERVICE_PORT');

  await app.listen(port);

  Logger.log(`Game service listening on port ${port}`, 'Bootstrap');
}

bootstrap();
