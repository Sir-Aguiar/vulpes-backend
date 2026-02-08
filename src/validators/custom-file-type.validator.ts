import { FileValidator } from '@nestjs/common';

export class CustomFileTypeValidator extends FileValidator<{
  allowedTypes: string[];
}> {
  buildErrorMessage(): string {
    return `File type not allowed. Allowed types: ${this.validationOptions.allowedTypes.join(', ')}`;
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file) return false;
    return this.validationOptions.allowedTypes.includes(file.mimetype);
  }
}
