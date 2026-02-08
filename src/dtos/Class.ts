import * as Zod from 'zod';

export const CreateClassSchema = Zod.object({
  name: Zod.string().min(1, 'Defina um nome para a turma'),
});

export const UpdateClassSchema = Zod.object({
  name: Zod.string().min(1, 'Defina um nome para a turma').optional(),
});

export const GetClassesQuerySchema = Zod.object({
  page: Zod.string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10)),
  limit: Zod.string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10)),
  professorId: Zod.string().optional(),
  search: Zod.string().optional(),
});

export const JoinClassByCodeSchema = Zod.object({
  code: Zod.number()
    .int()
    .min(1000, 'Código deve ter 4 dígitos')
    .max(9999, 'Código deve ter 4 dígitos'),
  message: Zod.string().optional(),
});

export type ICreateClassDTO = Zod.infer<typeof CreateClassSchema>;
export type IUpdateClassDTO = Zod.infer<typeof UpdateClassSchema>;
export type IGetClassesQuery = Zod.infer<typeof GetClassesQuerySchema>;
export type IJoinClassByCodeDTO = Zod.infer<typeof JoinClassByCodeSchema>;
