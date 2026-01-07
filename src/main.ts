import { NestFactory } from '@nestjs/core';
import { AppModule } from './routes/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigin = '*';

  app.enableCors({
    origin: allowedOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 8080);
}

bootstrap();
