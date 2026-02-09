import * as Zod from 'zod';
import { Role } from '@prisma/client';

export const CreateUserSchema = Zod.object({
  name: Zod.string().min(3, 'O nome de usuário deve ter ao menos 3 caracteres'),
  email: Zod.email('Email inválido'),
  password: Zod.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
  institutionId: Zod.number().optional(),
  role: Zod.enum(Role),
});

export type ICreateUserDTO = Zod.infer<typeof CreateUserSchema>;
