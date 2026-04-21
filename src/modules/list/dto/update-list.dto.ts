import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateListSchema = z
  .object({
    title: z.string().min(1, 'Defina um título para a lista').optional(),
    deadline: z.iso.datetime('Data limite inválida').optional(),
    submissionLimit: z.number().int().min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export class UpdateListDto extends createZodDto(updateListSchema) {}
