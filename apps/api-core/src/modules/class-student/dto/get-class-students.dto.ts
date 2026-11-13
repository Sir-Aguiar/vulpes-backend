import { createZodDto } from 'nestjs-zod';
import { paginationSchema } from '../../../common/pagination/pagination.types';

export const getClassStudentsQuerySchema = paginationSchema;

export class GetClassStudentsQueryDto extends createZodDto(
  getClassStudentsQuerySchema,
) {}
