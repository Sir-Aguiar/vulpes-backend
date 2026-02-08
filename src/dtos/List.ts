import * as Zod from 'zod';

export const CreateListSchema = Zod.object({
  classId: Zod.uuid('ID da turma inválido'),
  title: Zod.string().min(1, 'Defina um título para a lista'),
  deadline: Zod.iso.datetime('Data limite inválida'),
  submissionLimit: Zod.number().int().min(1).optional().default(1),
  taskIds: Zod.array(Zod.uuid('ID da tarefa inválido')).optional(),
});

export const UpdateListSchema = Zod.object({
  title: Zod.string().min(1, 'Defina um título para a lista').optional(),
  deadline: Zod.iso.datetime('Data limite inválida').optional(),
  submissionLimit: Zod.number().int().min(1).optional(),
});

export const GetListsQuerySchema = Zod.object({
  page: Zod.string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10)),
  limit: Zod.string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10)),
  classId: Zod.uuid().optional(),
});

export type ICreateListDTO = Zod.infer<typeof CreateListSchema>;
export type IUpdateListDTO = Zod.infer<typeof UpdateListSchema>;
export type IGetListsQuery = Zod.infer<typeof GetListsQuerySchema>;
