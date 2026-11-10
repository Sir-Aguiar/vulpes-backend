import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const colorThemeSchema = z.enum(['light', 'dark']);

export const userPreferencesSchema = z
  .object({
    theme: colorThemeSchema.optional(),
    editorFontSize: z
      .number()
      .int('O tamanho da fonte deve ser um inteiro')
      .min(8, 'O tamanho da fonte deve ser no mínimo 8')
      .max(32, 'O tamanho da fonte deve ser no máximo 32')
      .optional(),
    editorWordWrap: z.boolean().optional(),
    editorTheme: z
      .string()
      .min(1, 'O tema do editor não pode ser vazio')
      .max(64, 'O tema do editor deve ter no máximo 64 caracteres')
      .optional(),
    adminNotifyBugReport: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos uma preferência para atualizar',
  });

export class UserPreferencesDto extends createZodDto(userPreferencesSchema) {}

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
