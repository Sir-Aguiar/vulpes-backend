import * as Zod from 'zod';

export const CreateSubmissionSchema = Zod.object({
  studentId: Zod.string().optional(),
  taskId: Zod.string().min(1, 'Defina o ID da tarefa'),
  code: Zod.string().min(1, 'Defina o código submetido'),
  isCorrect: Zod.boolean().default(false),
});

export type ICreateSubmissionDTO = Zod.infer<typeof CreateSubmissionSchema>;
