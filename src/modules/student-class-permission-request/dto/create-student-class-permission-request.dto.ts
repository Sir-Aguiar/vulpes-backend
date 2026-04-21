import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createStudentClassPermissionRequestSchema = z.object({
  classId: z.uuid('ID da turma inválido'),
  message: z.string().optional(),
});

export class CreateStudentClassPermissionRequestDto extends createZodDto(
  createStudentClassPermissionRequestSchema,
) {}
