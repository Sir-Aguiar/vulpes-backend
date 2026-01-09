import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

export class ApplicationError extends Error {
  constructor(
    public status: number,
    message: string,
    public error?: any,
    public stack?: string,
  ) {
    super(message);

    if (error) {
      this.logErrorDetails(error);
    }
  }

  public logErrorDetails(error: any) {
    if (error && error instanceof PrismaClientKnownRequestError) {
      console.log(
        '============================================================',
      );
      console.error('Prisma Error Code:', error.code);
      console.error('Prisma Error Meta:', error.meta);
      console.error('Prisma Error Message:', error.message);
      console.log(
        '============================================================',
      );
    }
  }

  static convertPrismaErrorToHttpStatus(errorCode: string): number {
    switch (errorCode) {
      case 'P2000': // Value too long for column
        return 400; // Bad Request
      case 'P2001': // Record not found
        return 404; // Not Found
      case 'P2002': // Unique constraint failed
        return 400; // Bad Request
      case 'P2003': // Foreign key constraint failed
        return 400; // Bad Request
      case 'P2004': // A constraint failed on the database
        return 409; // Conflict
      case 'P2006': // The provided value is not valid for the column's data type
        return 422; // Unprocessable Entity
      case 'P2005': // The value is invalid for the column's data type
        return 422; // Unprocessable Entity
      default:
        return 500; // Internal Server Error
    }
  }
}
