import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationSchema } from '../../../common/pagination/pagination.types';

export const getClassTasksQuerySchema = paginationSchema.extend({
  classId: z.uuid().optional(),
});

export class GetClassTasksQueryDto extends createZodDto(
  getClassTasksQuerySchema,
) {}
