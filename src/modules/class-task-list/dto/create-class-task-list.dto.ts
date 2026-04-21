import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createClassTaskListSchema = z.object({
  classId: z.uuid('ID da turma inválido'),
  taskId: z.uuid('ID da tarefa inválido'),
  listId: z.uuid('ID da lista inválido'),
});

export class CreateClassTaskListDto extends createZodDto(
  createClassTaskListSchema,
) {}
