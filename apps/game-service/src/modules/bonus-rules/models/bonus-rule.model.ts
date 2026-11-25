export const GAME_EVENTS = ['SUBMISSION_CORRECT', 'LIST_SUBMITTED'] as const;
export type GameEvent = (typeof GAME_EVENTS)[number];

export const BONUS_FACTS = [
  'firstTry',
  'onTime',
  'isFirstPerfectDelivery',
] as const;
export type BonusFact = (typeof BONUS_FACTS)[number];

export const CONDITION_OPERATORS = [
  '==',
  '!=',
  '>',
  '>=',
  '<',
  '<=',
  'in',
] as const;
export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];

/** Fatos que o evento realmente fornece. Um fato novo exige código. */
export const FACTS_BY_EVENT: Record<GameEvent, readonly BonusFact[]> = {
  SUBMISSION_CORRECT: ['firstTry'],
  LIST_SUBMITTED: ['onTime', 'isFirstPerfectDelivery'],
};

export type ConditionValue =
  | boolean
  | number
  | string
  | Array<boolean | number | string>;

export interface BonusCondition {
  fact: BonusFact;
  op: ConditionOperator;
  value: ConditionValue;
}

export interface PercentBonus {
  type: 'PERCENT';
  value: number;
}

/**
 * Documento da coleção de regras no Firestore, já convertido para o domínio.
 * `createdAt` e `updatedAt` são gravados pelo servidor.
 */
export interface IBonusRule {
  ruleId: string;
  active: boolean;
  appliesTo: GameEvent[];
  conditions: BonusCondition[];
  bonus: PercentBonus;
  createdAt: Date;
  updatedAt: Date;
}
