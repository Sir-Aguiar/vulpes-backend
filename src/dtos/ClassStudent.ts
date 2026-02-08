import * as Zod from 'zod';

export const CreateClassStudentSchema = Zod.object({
  classId: Zod.uuid('ID da turma inválido'),
  studentId: Zod.uuid('ID do estudante inválido'),
});

export const GetClassStudentsQuerySchema = Zod.object({
  page: Zod.string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10)),
  limit: Zod.string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10)),
});

export type ICreateClassStudentDTO = Zod.infer<typeof CreateClassStudentSchema>;
export type IGetClassStudentsQuery = Zod.infer<
  typeof GetClassStudentsQuerySchema
>;
