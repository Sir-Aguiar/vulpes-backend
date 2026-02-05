import * as Zod from 'zod';

export const CodeTestSchema = Zod.object({
  input: Zod.array(Zod.string()).min(1, 'Defina ao menos uma entrada'),
  expectedOutput: Zod.string().min(1, 'Defina uma saída esperada'),
  expectedOutputType: Zod.string().min(1, 'Defina o tipo da saída esperada'),
});

export const ParamSchema = Zod.object({
  paramId: Zod.string().min(1, 'ID de parâmetro inválido'),
  name: Zod.string().min(1, 'Defina o nome do parâmetro'),
  type: Zod.string().min(1, 'Defina o tipo do parâmetro'),
  isArray: Zod.boolean().default(false),
});

export const CreateTaskSchema = Zod.object({
  title: Zod.string().min(1, 'Defina um título'),
  description: Zod.string().min(1, 'Defina uma descrição'),
  functionDef: Zod.string().min(1, 'Defina a assinatura da função'),
  inputMode: Zod.enum(['PARAM', 'LEIA']),
  isVisible: Zod.boolean().default(true),
  isPublic: Zod.boolean().default(false),
  taskParams: Zod.array(ParamSchema).min(1, 'Defina ao menos um parâmetro'),
  testCases: Zod.array(CodeTestSchema).min(
    1,
    'Defina ao menos um caso de teste',
  ),
  classIds: Zod.array(Zod.string().uuid()).optional().default([]),
});

export const UpdateTaskParamSchema = Zod.object({
  paramId: Zod.string().optional(),
  name: Zod.string().min(1, 'Defina o nome do parâmetro'),
  type: Zod.string().min(1, 'Defina o tipo do parâmetro'),
  isArray: Zod.boolean().default(false),
});

export const UpdateTaskTestSchema = Zod.object({
  testId: Zod.string().optional(),
  input: Zod.array(Zod.string()).min(1, 'Defina ao menos uma entrada'),
  expectedOutput: Zod.string().min(1, 'Defina uma saída esperada'),
  expectedOutputType: Zod.string().min(1, 'Defina o tipo da saída esperada'),
});

export const UpdateTaskSchema = Zod.object({
  title: Zod.string().min(1, 'Defina um título').optional(),
  description: Zod.string().min(1, 'Defina uma descrição').optional(),
  functionDef: Zod.string().min(1, 'Defina a assinatura da função').optional(),
  inputMode: Zod.enum(['PARAM', 'LEIA']).optional(),
  isVisible: Zod.boolean().optional(),
  isPublic: Zod.boolean().optional(),
  taskParams: Zod.array(UpdateTaskParamSchema).optional(),
  taskTests: Zod.array(UpdateTaskTestSchema).optional(),
  classIds: Zod.array(Zod.uuid()).optional(),
});

export const GetTasksQuerySchema = Zod.object({
  page: Zod.string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10)),
  limit: Zod.string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10)),
  creatorId: Zod.string().optional(),
  isPublic: Zod.string().optional(),
  isVisible: Zod.string().optional(),
  includePublicVisible: Zod.union([Zod.string(), Zod.boolean()])
    .optional()
    .transform((val) => val === true || val === 'true'),
  search: Zod.string().optional(),
});

export type ICreateTaskDTO = Zod.infer<typeof CreateTaskSchema>;
export type IParam = Zod.infer<typeof ParamSchema>;
export type ICodeTest = Zod.infer<typeof CodeTestSchema>;
export type IUpdateTaskDTO = Zod.infer<typeof UpdateTaskSchema>;
export type IUpdateTaskParam = Zod.infer<typeof UpdateTaskParamSchema>;
export type IUpdateTaskTest = Zod.infer<typeof UpdateTaskTestSchema>;
export type IGetTasksQuery = Zod.infer<typeof GetTasksQuerySchema>;
