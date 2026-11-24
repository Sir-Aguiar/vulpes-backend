import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUserSchema = z.object({
  userId: z.uuid('ID do usuário inválido'),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}
