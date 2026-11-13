import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createSubmissionSchema = z
  .object({
    taskId: z.uuid('ID da tarefa inválido').optional(),
    classTaskId: z.uuid('ID da tarefa na turma inválido').optional(),
    classTaskListId: z.uuid('ID da tarefa na lista inválido').optional(),
    code: z.string().min(1, 'Defina o código submetido'),
    isCorrect: z.boolean().default(false),
    submittedAt: z.string().datetime().optional(),
  })
  .superRefine((data, ctx) => {
    const filled = [data.taskId, data.classTaskId, data.classTaskListId].filter(
      Boolean,
    ).length;

    if (filled !== 1) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Informe exatamente um contexto: taskId, classTaskId ou classTaskListId',
      });
    }
  });

export class CreateSubmissionDto extends createZodDto(createSubmissionSchema) {}
