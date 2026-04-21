import { FileValidator } from '@nestjs/common';

export interface CustomFileTypeOptions {
  allowedTypes: string[];
}

export class CustomFileTypeValidator extends FileValidator<CustomFileTypeOptions> {
  buildErrorMessage(): string {
    return `Tipo de arquivo não permitido. Tipos aceitos: ${this.validationOptions.allowedTypes.join(', ')}`;
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file) return false;
    return this.validationOptions.allowedTypes.includes(file.mimetype);
  }
}
