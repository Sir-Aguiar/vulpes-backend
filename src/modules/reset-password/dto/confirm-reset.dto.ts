import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const confirmResetSchema = z.object({
  orderId: z.string().uuid('orderId inválido'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
});

export class ConfirmResetDto extends createZodDto(confirmResetSchema) {}
