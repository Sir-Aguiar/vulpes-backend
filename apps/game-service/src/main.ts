import { NestFactory } from '@nestjs/core';
import { GameServiceModule } from './game-service.module';

async function bootstrap() {
  const app = await NestFactory.create(GameServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
