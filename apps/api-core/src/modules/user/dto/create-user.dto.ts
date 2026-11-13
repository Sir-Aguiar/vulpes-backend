import { Role } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(3, 'O nome de usuário deve ter ao menos 3 caracteres'),
  email: z.email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
  institutionId: z.number().int().positive().optional(),
  role: z.enum(Role),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}
