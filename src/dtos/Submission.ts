import * as Zod from 'zod';

export const CreateSubmissionSchema = Zod.object({
  studentId: Zod.string().min(1, 'Defina o ID do estudante'),
  taskId: Zod.string().min(1, 'Defina o ID da tarefa'),
  code: Zod.string().min(1, 'Defina o código submetido'),
  isCorrect: Zod.boolean().default(false),
});

export const SendFeedbackSchema = Zod.object({
  professorComments: Zod.string().optional(),
});

export type ICreateSubmissionDTO = Zod.infer<typeof CreateSubmissionSchema>;
export type ISendFeedbackDTO = Zod.infer<typeof SendFeedbackSchema>;
