import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getPublishedTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(15),
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  sortBy: z.enum(['createdAt', 'title']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export class GetPublishedTasksQueryDto extends createZodDto(
  getPublishedTasksQuerySchema,
) {}

/**
 * Catálogo público de tarefas (homepage). Retorna apenas `taskId` — sem
 * contexto de turma (`classTaskId`) ou lista (`classTaskListId`).
 */
export interface PublishedTask {
  taskId: string;
  creatorId: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  isVisible: boolean;
  creator: {
    userId: string;
    name: string;
  };
}
