import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

export const createBugReportSchema = z.object({
  path: z.string().trim().min(1, 'Informe o caminho onde o bug ocorreu'),
  description: z.string().trim().min(1, 'Informe a descrição do bug'),
  expectedBehavior: optionalText,
  actualBehavior: optionalText,
  stepsToReproduce: optionalText,
  os: optionalText,
  browser: optionalText,
  screenshots: z.array(z.url()).default([]),
});

export type CreateBugReportDto = z.infer<typeof createBugReportSchema>;

export type CreateBugReportInput = CreateBugReportDto & {
  userId: string;
};
