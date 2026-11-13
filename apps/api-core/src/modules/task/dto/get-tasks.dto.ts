import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationSchema } from '../../../common/pagination/pagination.types';

/**
 * Aceita tanto boolean quanto string ("true"/"false") porque query params
 * chegam sempre como string em requisições HTTP.
 */
const stringBool = z
  .union([z.string(), z.boolean()])
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined;
    return val === true || val === 'true';
  });

export const getTasksQuerySchema = paginationSchema.extend({
  creatorId: z.string().optional(),
  isPublic: stringBool,
  isVisible: stringBool,
  includePublicVisible: stringBool,
  search: z.string().optional(),
});

export class GetTasksQueryDto extends createZodDto(getTasksQuerySchema) {}
