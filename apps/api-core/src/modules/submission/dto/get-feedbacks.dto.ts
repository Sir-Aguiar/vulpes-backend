import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Query params chegam como string. Só `true` e `"true"` ligam o widget;
 * `"false"`, ausência e qualquer outro valor desligam.
 */
const stringBool = z
  .union([z.string(), z.boolean()])
  .optional()
  .transform((val) => val === true || val === 'true');

export const getFeedbacksQuerySchema = z.object({
  isWidget: stringBool,
});

export class GetFeedbacksQueryDto extends createZodDto(
  getFeedbacksQuerySchema,
) {}
