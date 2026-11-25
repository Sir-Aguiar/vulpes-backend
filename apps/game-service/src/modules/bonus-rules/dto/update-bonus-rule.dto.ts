import { z } from 'zod';
import {
  appliesToSchema,
  assertFactsMatchEvents,
  conditionsSchema,
  percentBonusSchema,
} from './bonus-rule.schema';

export const updateBonusRuleSchema = z
  .object({
    active: z.boolean().optional(),
    appliesTo: appliesToSchema.optional(),
    conditions: conditionsSchema.optional(),
    bonus: percentBonusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  })
  .superRefine(assertFactsMatchEvents);

export type UpdateBonusRuleDto = z.infer<typeof updateBonusRuleSchema>;
