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
  creatorId: Zod.string().min(1, 'Defina o criador da tarefa'),
  functionDef: Zod.string().min(1, 'Defina a assinatura da função'),
  inputMode: Zod.string(),
  isVisible: Zod.boolean().default(true),
  taskParams: Zod.array(ParamSchema).min(1, 'Defina ao menos um parâmetro'),
  testCases: Zod.array(CodeTestSchema).min(
    1,
    'Defina ao menos um caso de teste',
  ),
});

export type ICreateTaskDTO = Zod.infer<typeof CreateTaskSchema>;
export type IParam = Zod.infer<typeof ParamSchema>;
export type ICodeTest = Zod.infer<typeof CodeTestSchema>;
