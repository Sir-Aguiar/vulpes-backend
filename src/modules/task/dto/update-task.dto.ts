import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const updateTaskParamSchema = z.object({
  paramId: z.string().optional(),
  name: z.string().min(1, 'Defina o nome do parâmetro'),
  type: z.string().min(1, 'Defina o tipo do parâmetro'),
  isArray: z.boolean().default(false),
});

const updateTaskTestSchema = z.object({
  testId: z.string().optional(),
  input: z.array(z.string()).min(1, 'Defina ao menos uma entrada'),
  expectedOutput: z.string().min(1, 'Defina uma saída esperada'),
  expectedOutputType: z.string().min(1, 'Defina o tipo da saída esperada'),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Defina um título').optional(),
  description: z.string().min(1, 'Defina uma descrição').optional(),
  functionDef: z.string().min(1, 'Defina a assinatura da função').optional(),
  inputMode: z.enum(['PARAM', 'LEIA']).optional(),
  isVisible: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  taskParams: z.array(updateTaskParamSchema).optional(),
  taskTests: z.array(updateTaskTestSchema).optional(),
  classIds: z.array(z.uuid()).optional(),
});

export class UpdateTaskDto extends createZodDto(updateTaskSchema) {}
export type UpdateTaskParam = z.infer<typeof updateTaskParamSchema>;
export type UpdateTaskTest = z.infer<typeof updateTaskTestSchema>;
