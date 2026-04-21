import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const sendFeedbackSchema = z.object({
  professorComments: z.string().min(1, 'Defina o comentário do professor'),
});

export class SendFeedbackDto extends createZodDto(sendFeedbackSchema) {}
