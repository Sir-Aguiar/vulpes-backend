import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string().min(1, 'Defina um nome para a turma'),
});

export class CreateClassDto extends createZodDto(createClassSchema) {}
