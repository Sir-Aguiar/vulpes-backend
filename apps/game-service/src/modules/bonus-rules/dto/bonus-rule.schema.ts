import { z } from 'zod';
import {
  BONUS_FACTS,
  CONDITION_OPERATORS,
  FACTS_BY_EVENT,
  GAME_EVENTS,
} from '../models/bonus-rule.model';

const COMPARISON_OPERATORS = ['>', '>=', '<', '<='] as const;

const primitiveValueSchema = z.union([
  z.boolean(),
  z.number(),
  z.string().min(1, 'O valor da condição não pode ser vazio'),
]);

export const bonusConditionSchema = z
  .object({
    fact: z.enum(BONUS_FACTS, 'Fato desconhecido'),
    op: z.enum(CONDITION_OPERATORS, 'Operador desconhecido'),
    value: z.union([
      primitiveValueSchema,
      z
        .array(primitiveValueSchema)
        .min(1, 'O operador "in" exige ao menos um valor'),
    ]),
  })
  .superRefine((condition, ctx) => {
    const isList = Array.isArray(condition.value);

    if (condition.op === 'in' && !isList) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'O operador "in" exige uma lista de valores',
      });
    }

    if (condition.op !== 'in' && isList) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'Somente o operador "in" aceita uma lista de valores',
      });
    }

    if (
      COMPARISON_OPERATORS.includes(
        condition.op as (typeof COMPARISON_OPERATORS)[number],
      ) &&
      typeof condition.value !== 'number'
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'Operadores de comparação exigem um valor numérico',
      });
    }
  });

export const percentBonusSchema = z.object({
  type: z.literal('PERCENT'),
  value: z
    .number()
    .positive('O bônus percentual deve ser maior que 0')
    .max(100, 'O bônus percentual de uma regra não pode passar de 100'),
});

export const ruleIdSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9_]*$/,
    'O identificador deve estar em snake_case, começando com letra',
  );

export const appliesToSchema = z
  .array(z.enum(GAME_EVENTS, 'Evento desconhecido'))
  .min(1, 'Informe ao menos um evento')
  .refine((events) => new Set(events).size === events.length, {
    message: 'Os eventos não podem se repetir',
  });

export const conditionsSchema = z
  .array(bonusConditionSchema)
  .min(1, 'Informe ao menos uma condição');

/** Cada fato precisa existir em todos os eventos aos quais a regra se aplica. */
export function assertFactsMatchEvents(
  value: {
    appliesTo?: z.infer<typeof appliesToSchema>;
    conditions?: z.infer<typeof conditionsSchema>;
  },
  ctx: z.RefinementCtx,
) {
  if (!value.appliesTo || !value.conditions) {
    return;
  }

  value.conditions.forEach((condition, index) => {
    const missing = value.appliesTo!.filter(
      (event) => !FACTS_BY_EVENT[event].includes(condition.fact),
    );

    if (missing.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['conditions', index, 'fact'],
        message: `O fato "${condition.fact}" não existe nos eventos: ${missing.join(', ')}`,
      });
    }
  });
}
