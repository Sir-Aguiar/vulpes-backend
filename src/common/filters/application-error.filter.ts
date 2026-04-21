import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApplicationError } from '../errors/application.error';

/**
 * Captura erros de domínio (`ApplicationError`) e traduz para uma resposta
 * HTTP padronizada com o envelope `{ error: { status, message, ... } }`.
 *
 * Diferença para os filtros de Prisma: este tratador é acionado quando
 * o próprio domínio decide falhar de forma explícita (regra de negócio),
 * não quando o banco rejeita a operação.
 */
@Catch(ApplicationError)
export class ApplicationErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApplicationErrorFilter.name);

  catch(exception: ApplicationError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.warn(
      `[${request.method} ${request.url}] ${exception.status} ${exception.message}`,
    );

    response.status(exception.status).json({
      error: {
        status: exception.status,
        message: exception.message,
        name: exception.name,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
