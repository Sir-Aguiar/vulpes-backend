import { Logger } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { ApplicationErrorFilter } from './common/filters/application-error.filter';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { PrismaValidationExceptionFilter } from './common/filters/prisma-validation-exception.filter';
import { EnvService } from './config/env.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const envService = app.get(EnvService);

  app.enableCors({
    origin: envService.get('CORS_ORIGIN'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new PrismaClientExceptionFilter(httpAdapter),
    new PrismaValidationExceptionFilter(),
    new ApplicationErrorFilter(),
  );

  /**
   * OpenAPI (Swagger) — gerado automaticamente a partir dos DTOs Zod
   * via `nestjs-zod`. A UI interativa fica em `/api` e o JSON bruto em
   * `/api-json`, útil para gerar clientes TypeScript no front.
   */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Vulpes API')
    .setDescription(
      'API do Vulpes — plataforma educacional de tarefas de programação. ' +
        'Autentique-se em `POST /auth/login` e use o token no botão "Authorize".',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .addTag('auth', 'Autenticação e cadastro de usuários')
    .addTag('user', 'Dados do usuário autenticado (perfil, troca de email)')
    .addTag('class', 'Turmas (criação, consulta, matrícula)')
    .addTag('class-student', 'Vínculo de estudantes com turmas')
    .addTag('class-task', 'Associação de tarefas a turmas')
    .addTag('class-task-list', 'Associação de tarefas a listas de uma turma')
    .addTag('list', 'Listas de exercícios dentro de uma turma')
    .addTag('task', 'Tarefas (problemas de programação) e seus testes')
    .addTag('submission', 'Submissões de código dos estudantes')
    .addTag('institution', 'Instituições de ensino')
    .addTag(
      'professor-permission-request',
      'Solicitações de promoção a professor',
    )
    .addTag(
      'student-class-permission-request',
      'Solicitações de matrícula em turmas',
    )
    .build();

  const openApiDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, cleanupOpenApiDoc(openApiDoc), {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = envService.get('PORT');
  await app.listen(port);
  Logger.log(`Application listening on port ${port}`, 'Bootstrap');
  Logger.log(`Swagger UI available at /api`, 'Bootstrap');
}

bootstrap();
