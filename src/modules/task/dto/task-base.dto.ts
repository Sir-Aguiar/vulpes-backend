import { z } from 'zod';

export const taskParamSchema = z.object({
  paramId: z.string().min(1, 'ID de parâmetro inválido'),
  name: z.string().min(1, 'Defina o nome do parâmetro'),
  type: z.string().min(1, 'Defina o tipo do parâmetro'),
  isArray: z.boolean().default(false),
});

export const codeTestSchema = z.object({
  input: z.array(z.string()).min(1, 'Defina ao menos uma entrada'),
  expectedOutput: z.string().min(1, 'Defina uma saída esperada'),
  expectedOutputType: z.string().min(1, 'Defina o tipo da saída esperada'),
});

export type TaskParam = z.infer<typeof taskParamSchema>;
export type CodeTest = z.infer<typeof codeTestSchema>;
