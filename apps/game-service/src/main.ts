import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
import { GameServiceModule } from './game-service.module';

async function bootstrap() {
  const app = await NestFactory.create(GameServiceModule);
  const port = Number(process.env.GAME_SERVICE_PORT ?? 8081);

  await app.listen(port);

  Logger.log(`Game service listening on port ${port}`, 'Bootstrap');
}

bootstrap();
