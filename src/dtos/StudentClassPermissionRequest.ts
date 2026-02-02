import * as Zod from 'zod';

export const CreateStudentClassPermissionRequestSchema = Zod.object({
  classId: Zod.uuid('ID da turma inválido'),
  message: Zod.string().optional(),
});

export const GetStudentClassPermissionRequestsQuerySchema = Zod.object({
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

export type ICreateStudentClassPermissionRequestDTO = Zod.infer<
  typeof CreateStudentClassPermissionRequestSchema
>;
export type IGetStudentClassPermissionRequestsQuery = Zod.infer<
  typeof GetStudentClassPermissionRequestsQuerySchema
>;
