import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const requestResetSchema = z.object({
  email: z.email('Email inválido'),
});

export class RequestResetDto extends createZodDto(requestResetSchema) {}
