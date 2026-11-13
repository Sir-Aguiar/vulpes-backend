import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

type PrismaErrorMapping = {
  status: HttpStatus;
  message: (exception: Prisma.PrismaClientKnownRequestError) => string;
};

/**
 * Mapa de códigos de erro do Prisma para respostas HTTP amigáveis.
 *
 * Referência dos códigos: https://www.prisma.io/docs/orm/reference/error-reference
 * Códigos não mapeados caem no fallback do `BaseExceptionFilter` (500).
 */
const PRISMA_ERROR_MAP: Record<string, PrismaErrorMapping> = {
  P2000: {
    status: HttpStatus.BAD_REQUEST,
    message: () => 'O valor fornecido é muito longo para o campo.',
  },
  P2002: {
    status: HttpStatus.CONFLICT,
    message: (e) => {
      const fields = (e.meta?.target as string[] | undefined)?.join(', ');
      return `Restrição de chave única falhou${fields ? ` (Campo: ${fields})` : ''}`;
    },
  },
  P2003: {
    status: HttpStatus.BAD_REQUEST,
    message: () =>
      'Registro relacionado não encontrado. Restrição de chave estrangeira falhou.',
  },
  P2014: {
    status: HttpStatus.BAD_REQUEST,
    message: () => 'A operação viola uma relação obrigatória entre registros.',
  },
  P2025: {
    status: HttpStatus.NOT_FOUND,
    message: () => 'Registro não encontrado.',
  },
};

/**
 * Traduz erros conhecidos do Prisma (violação de constraint, not found, etc.)
 * em respostas HTTP semânticas. Só captura `PrismaClientKnownRequestError`;
 * erros de validação de schema vão para `PrismaValidationExceptionFilter`.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    this.logger.error(
      `Prisma error ${exception.code}: ${exception.message.replace(/\n/g, ' ')}`,
    );

    const mapping = PRISMA_ERROR_MAP[exception.code];
    if (!mapping) {
      super.catch(exception, host);
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(mapping.status).json({
      statusCode: mapping.status,
      message: mapping.message(exception),
    });
  }
}
