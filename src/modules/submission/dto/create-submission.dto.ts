import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createSubmissionSchema = z.object({
  taskId: z.uuid('ID da tarefa inválido'),
  listId: z.uuid('ID da lista inválido').optional(),
  code: z.string().min(1, 'Defina o código submetido'),
  isCorrect: z.boolean().default(false),
  submittedAt: z.string().datetime().optional(),
});

export class CreateSubmissionDto extends createZodDto(createSubmissionSchema) {}
