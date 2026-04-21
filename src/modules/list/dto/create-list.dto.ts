import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createListSchema = z.object({
  classId: z.uuid('ID da turma inválido'),
  title: z.string().min(1, 'Defina um título para a lista'),
  deadline: z.iso.datetime('Data limite inválida'),
  submissionLimit: z.number().int().min(1).optional().default(1),
  taskIds: z.array(z.uuid('ID da tarefa inválido')).optional(),
});

export class CreateListDto extends createZodDto(createListSchema) {}
