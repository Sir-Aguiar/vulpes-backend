import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApplicationError } from '../entities/errors/ApplicationError';

@Catch(ApplicationError)
export class ApplicationErrorFilter implements ExceptionFilter {
  catch(exception: ApplicationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

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
