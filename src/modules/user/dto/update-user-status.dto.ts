import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  desativado: z.boolean(),
});

export class UpdateUserStatusDto extends createZodDto(updateUserStatusSchema) {}
