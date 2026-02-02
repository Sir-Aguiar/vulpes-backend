import * as Zod from 'zod';

export const CreateClassTaskListSchema = Zod.object({
  classId: Zod.uuid('ID da turma inválido'),
  taskId: Zod.uuid('ID da tarefa inválido'),
  listId: Zod.uuid('ID da lista inválido'),
});

export const GetClassTaskListsQuerySchema = Zod.object({
  page: Zod.string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10)),
  limit: Zod.string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10)),
  listId: Zod.uuid().optional(),
  classId: Zod.uuid().optional(),
});

export type ICreateClassTaskListDTO = Zod.infer<
  typeof CreateClassTaskListSchema
>;
export type IGetClassTaskListsQuery = Zod.infer<
  typeof GetClassTaskListsQuerySchema
>;
