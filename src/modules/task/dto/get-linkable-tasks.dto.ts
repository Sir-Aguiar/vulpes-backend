import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getLinkableTasksQuerySchema = z.object({
  classId: z.uuid('ID da turma inválido'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export class GetLinkableTasksQueryDto extends createZodDto(
  getLinkableTasksQuerySchema,
) {}

/**
 * Shape enxuto retornado por `getTasksLinkableToClass`. Apenas os campos
 * necessários para a UI de vinculação — evita trafegar `taskParams`,
 * `taskTests` e outros dados pesados que não são usados na listagem.
 */
export interface LinkableTask {
  taskId: string;
  creatorId: string;
  title: string;
  description: string;
  updatedAt: Date;
  createdAt: Date;
  isPublic: boolean;
  isVisible: boolean;
}
