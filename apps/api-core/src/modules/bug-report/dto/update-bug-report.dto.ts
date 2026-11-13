import { BugReportSeverity, BugReportStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateBugReportSchema = z
  .object({
    status: z.nativeEnum(BugReportStatus).optional(),
    severity: z.nativeEnum(BugReportSeverity).optional(),
  })
  .refine((data) => data.status !== undefined || data.severity !== undefined, {
    message: 'Informe ao menos status ou severity para atualizar',
  });

export class UpdateBugReportDto extends createZodDto(updateBugReportSchema) {}

export type UpdateBugReportInput = z.infer<typeof updateBugReportSchema>;
