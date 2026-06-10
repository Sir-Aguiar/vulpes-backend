import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createClassTaskListSchema = z.object({
  classId: z.uuid('ID da turma inválido'),
  taskId: z.uuid('ID da tarefa inválido'),
  listId: z.uuid('ID da lista inválido'),
  weight: z.number().min(0.1, 'O peso deve ser no mínimo 0.1').default(1.0),
});

export class CreateClassTaskListDto extends createZodDto(
  createClassTaskListSchema,
) {}
