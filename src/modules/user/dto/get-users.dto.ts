import { Role } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export class GetUsersQueryDto extends createZodDto(getUsersQuerySchema) {}

export interface UserListItem {
  userId: string;
  name: string;
  email: string;
  createdAt: Date;
  desativado: boolean;
  role: Role;
}
