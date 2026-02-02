import * as Zod from 'zod';

export const CreateClassTaskSchema = Zod.object({
  classId: Zod.uuid('ID da turma inválido'),
  taskId: Zod.uuid('ID da tarefa inválido'),
});

export const GetClassTasksQuerySchema = Zod.object({
  page: Zod.string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10)),
  limit: Zod.string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10)),
  classId: Zod.string().uuid().optional(),
});

export type ICreateClassTaskDTO = Zod.infer<typeof CreateClassTaskSchema>;
export type IGetClassTasksQuery = Zod.infer<typeof GetClassTasksQuerySchema>;
