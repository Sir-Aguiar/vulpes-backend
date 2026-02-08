import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientValidationError)
export class PrismaValidationExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientValidationError, host: ArgumentsHost) {
    console.error(exception.message);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message:
        'Dados de entrada inválidos. Verifique os dados enviados e tente novamente.',
    });
  }
}
