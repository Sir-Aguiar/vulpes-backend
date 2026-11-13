import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationSchema } from '../../../common/pagination/pagination.types';

export const getListsQuerySchema = paginationSchema.extend({
  classId: z.uuid().optional(),
});

export class GetListsQueryDto extends createZodDto(getListsQuerySchema) {}
