import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createClassStudentSchema = z.object({
  classId: z.uuid('ID da turma inválido'),
  studentId: z.uuid('ID do estudante inválido'),
});

export class CreateClassStudentDto extends createZodDto(
  createClassStudentSchema,
) {}
