import { z } from 'zod';
import {
  appliesToSchema,
  assertFactsMatchEvents,
  conditionsSchema,
  percentBonusSchema,
  ruleIdSchema,
} from './bonus-rule.schema';

export const createBonusRuleSchema = z
  .object({
    ruleId: ruleIdSchema,
    active: z.boolean().default(true),
    appliesTo: appliesToSchema,
    conditions: conditionsSchema,
    bonus: percentBonusSchema,
  })
  .superRefine(assertFactsMatchEvents);

export type CreateBonusRuleDto = z.infer<typeof createBonusRuleSchema>;
