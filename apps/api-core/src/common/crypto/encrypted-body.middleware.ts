import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import {
  ENCRYPTED_BODY_HEADER,
  ENCRYPTED_BODY_HEADER_VALUE,
  ENCRYPTED_BODY_INVALID_MESSAGE,
} from './encrypted-body.schema';
import { EncryptedBodyService } from './encrypted-body.service';

/**
 * Substitui o envelope híbrido pelo JSON original em rotas de senha.
 * Precisa rodar depois do `json()` e antes do `ZodValidationPipe`.
 */
@Injectable()
export class EncryptedBodyMiddleware implements NestMiddleware {
  constructor(private readonly encryptedBodyService: EncryptedBodyService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      const header = req.headers[ENCRYPTED_BODY_HEADER];
      const value = Array.isArray(header) ? header[0] : header;

      if (value !== ENCRYPTED_BODY_HEADER_VALUE) {
        throw new BadRequestException(ENCRYPTED_BODY_INVALID_MESSAGE);
      }

      req.body = await this.encryptedBodyService.open(req.body, req.path);
      next();
    } catch (error) {
      next(error);
    }
  }
}
