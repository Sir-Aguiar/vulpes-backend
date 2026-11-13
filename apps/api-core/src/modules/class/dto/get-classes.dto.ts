import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationSchema } from '../../../common/pagination/pagination.types';

export const getClassesQuerySchema = paginationSchema.extend({
  professorId: z.uuid().optional(),
  search: z.string().optional(),
});

export class GetClassesQueryDto extends createZodDto(getClassesQuerySchema) {}
