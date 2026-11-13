import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

const logger = new Logger('ApplicationError');

export class ApplicationError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = ApplicationError.name;

    if (cause) {
      ApplicationError.logCauseDetails(cause);
    }
  }

  private static logCauseDetails(cause: unknown): void {
    if (cause instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error({
        code: cause.code,
        meta: cause.meta,
        message: cause.message,
      });
    }
  }

  static prismaErrorToHttpStatus(errorCode: string): number {
    switch (errorCode) {
      case 'P2000':
        return 400;
      case 'P2001':
        return 404;
      case 'P2002':
        return 409;
      case 'P2003':
        return 400;
      case 'P2004':
        return 409;
      case 'P2005':
      case 'P2006':
        return 422;
      case 'P2025':
        return 404;
      default:
        return 500;
    }
  }
}
