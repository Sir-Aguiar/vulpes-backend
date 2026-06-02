import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(3, 'O nome de usuário deve ter ao menos 3 caracteres')
      .optional(),
    email: z.email('Email inválido').optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
