import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './routes/app.module';
import { PrismaClientExceptionFilter } from './prisma-client-exception/prisma-client-exception.filter';
import { ApplicationErrorFilter } from './filters/ApplicationError.filter';
import { PrismaValidationExceptionFilter } from './prisma-client-exception/prisma-validation-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigin = '*';

  app.enableCors({
    origin: allowedOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new PrismaClientExceptionFilter(httpAdapter),
    new PrismaValidationExceptionFilter(),
    new ApplicationErrorFilter(),
  );

  await app.listen(process.env.PORT ?? 8080);
}

bootstrap();
