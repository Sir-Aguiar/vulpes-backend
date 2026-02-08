import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    console.error(exception.message);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message.replace(/\n/g, '');

    switch (exception.code) {
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          message:
            'Restrição de chave única falhou' +
            `(Campo: ${message.match(/Unique constraint failed on the fields: \((.+)\)/)?.[1] ?? 'desconhecido'})`,
        });
        break;
      }
      case 'P2003': {
        const status = HttpStatus.BAD_REQUEST;
        response.status(status).json({
          statusCode: status,
          message:
            'Registro relacionado não encontrado. Restrição de chave estrangeira falhou.',
        });
        break;
      }
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          statusCode: status,
          message: 'Registro não encontrado.',
        });
        break;
      }
      case 'P2014': {
        const status = HttpStatus.BAD_REQUEST;
        response.status(status).json({
          statusCode: status,
          message: 'A operação viola uma relação obrigatória entre registros.',
        });
        break;
      }
      case 'P2000': {
        const status = HttpStatus.BAD_REQUEST;
        response.status(status).json({
          statusCode: status,
          message: 'O valor fornecido é muito longo para o campo.',
        });
        break;
      }
      default:
        super.catch(exception, host);
        break;
    }
  }
}
