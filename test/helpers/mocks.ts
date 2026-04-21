import { Role } from '@prisma/client';
import type { AuthUser } from '../../src/common/types/auth-user.type';

export const buildAuthUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  userId: 'user-123',
  email: 'user@example.com',
  name: 'Test User',
  role: Role.PROFESSOR,
  ...overrides,
});

export const buildStudent = (overrides: Partial<AuthUser> = {}) =>
  buildAuthUser({ role: Role.STUDENT, ...overrides });

export const buildAdmin = (overrides: Partial<AuthUser> = {}) =>
  buildAuthUser({ role: Role.ADMIN, ...overrides });

export type MockedRepository<T extends object> = {
  [K in keyof T]: jest.Mock;
};

export const mockRepository = <T extends object>(
  methods: (keyof T)[],
): MockedRepository<T> => {
  const mock = {} as MockedRepository<T>;
  for (const method of methods) {
    mock[method] = jest.fn();
  }
  return mock;
};
