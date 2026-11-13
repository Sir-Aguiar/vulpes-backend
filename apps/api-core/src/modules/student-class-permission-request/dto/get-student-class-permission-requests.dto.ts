import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationSchema } from '../../../common/pagination/pagination.types';

export const getStudentClassPermissionRequestsQuerySchema =
  paginationSchema.extend({
    classId: z.uuid().optional(),
  });

export class GetStudentClassPermissionRequestsQueryDto extends createZodDto(
  getStudentClassPermissionRequestsQuerySchema,
) {}
