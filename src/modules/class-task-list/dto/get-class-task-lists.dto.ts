import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationSchema } from '../../../common/pagination/pagination.types';

export const getClassTaskListsQuerySchema = paginationSchema.extend({
  listId: z.uuid().optional(),
  classId: z.uuid().optional(),
});

export class GetClassTaskListsQueryDto extends createZodDto(
  getClassTaskListsQuerySchema,
) {}
