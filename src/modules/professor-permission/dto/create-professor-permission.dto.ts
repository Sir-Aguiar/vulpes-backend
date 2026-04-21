import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createProfessorPermissionSchema = z.object({
  name: z.string().min(1, 'Defina o nome'),
  personalEmail: z.email('Defina um email pessoal válido'),
  institutionalEmail: z.email('Defina um email institucional válido'),
  institutionId: z.coerce.number().int().positive('Defina a instituição'),
  requestFileUrl: z.url('Defina uma URL válida para o documento'),
});

export type CreateProfessorPermissionDto = z.infer<
  typeof createProfessorPermissionSchema
>;

export const respondProfessorPermissionSchema = z.object({
  requestStatus: z.enum(['APPROVED', 'REJECTED']),
});

export class RespondProfessorPermissionDto extends createZodDto(
  respondProfessorPermissionSchema,
) {}
