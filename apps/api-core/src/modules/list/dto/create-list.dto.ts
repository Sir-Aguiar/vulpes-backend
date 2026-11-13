import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const TasksSchema = z.array(
  z.object({
    taskId: z.uuid('ID da tarefa inválido'),
    weight: z.number().min(0.1, 'O peso deve ser no mínimo 0.1').default(1.0),
  }),
);

export const createListSchema = z.object({
  classId: z.uuid('ID da turma inválido'),
  title: z.string().min(1, 'Defina um título para a lista'),
  deadline: z.iso.datetime('Data limite inválida'),
  releaseDate: z.iso.datetime('Data de publicação inválida').optional(),
  submissionLimit: z.number().int().min(1).optional().default(1),
  tasks: TasksSchema.optional().default([]),
});

export class CreateListDto extends createZodDto(createListSchema) {}
