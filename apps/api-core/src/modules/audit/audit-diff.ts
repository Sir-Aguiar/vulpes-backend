import { Prisma } from '@prisma/client';
import { AuditDiff } from './audit.types';

const toJson = (value: unknown): Prisma.InputJsonValue | null => {
  if (value === undefined || value === null) return null;
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  return null;
};

const same = (left: unknown, right: unknown) =>
  Object.is(
    left instanceof Date ? left.toISOString() : left,
    right instanceof Date ? right.toISOString() : right,
  );

/** Diferença só das chaves que mudaram. `null` quando nada mudou. */
export const changedFields = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): AuditDiff | null => {
  const diffBefore: AuditDiff['before'] = {};
  const diffAfter: AuditDiff['after'] = {};

  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (same(before[key], after[key])) continue;
    diffBefore[key] = toJson(before[key]);
    diffAfter[key] = toJson(after[key]);
  }

  if (Object.keys(diffAfter).length === 0) return null;
  return { before: diffBefore, after: diffAfter };
};
