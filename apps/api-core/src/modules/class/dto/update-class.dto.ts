import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateClassSchema = z
  .object({
    name: z.string().min(1, 'Defina um nome para a turma').optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export class UpdateClassDto extends createZodDto(updateClassSchema) {}
