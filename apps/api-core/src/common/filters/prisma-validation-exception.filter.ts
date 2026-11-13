import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Filtra erros de validação de schema do Prisma Client — tipicamente
 * indicam que o payload chegou ao driver com tipos incompatíveis
 * (ex.: número onde se esperava string). A mensagem original do Prisma
 * é sensível (expõe o schema interno); devolvemos uma mensagem genérica
 * ao cliente e mantemos o detalhe apenas no log.
 */
@Catch(Prisma.PrismaClientValidationError)
export class PrismaValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaValidationExceptionFilter.name);

  catch(
    exception: Prisma.PrismaClientValidationError,
    host: ArgumentsHost,
  ): void {
    this.logger.error(`Prisma validation error: ${exception.message}`);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message:
        'Dados de entrada inválidos. Verifique os dados enviados e tente novamente.',
    });
  }
}
