import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createClassTaskSchema = z.object({
  classId: z.uuid('ID da turma inválido'),
  taskId: z.uuid('ID da tarefa inválido'),
});

export class CreateClassTaskDto extends createZodDto(createClassTaskSchema) {}
