import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { codeTestSchema, taskParamSchema } from './task-base.dto';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Defina um título'),
  description: z.string().min(1, 'Defina uma descrição'),
  functionDef: z.string().min(1, 'Defina a assinatura da função'),
  inputMode: z.enum(['PARAM', 'LEIA']),
  isVisible: z.boolean().default(true),
  isPublic: z.boolean().default(false),
  taskParams: z.array(taskParamSchema).min(1, 'Defina ao menos um parâmetro'),
  testCases: z.array(codeTestSchema).min(1, 'Defina ao menos um caso de teste'),
  classIds: z.array(z.uuid()).optional().default([]),
});

export class CreateTaskDto extends createZodDto(createTaskSchema) {}
