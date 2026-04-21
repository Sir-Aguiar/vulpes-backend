import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser } from '../types/auth-user.type';

/**
 * Helpers de autorização reutilizados por vários services.
 *
 * Convenção: funções `isX` são puras (boolean), funções `ensureX` lançam
 * `ForbiddenException` quando a regra é violada — use `ensureX` no caminho
 * principal do service para falhar cedo com mensagem específica.
 */

export const isAdmin = (user: Pick<AuthUser, 'role'>): boolean =>
  user.role === Role.ADMIN;

export const isProfessor = (user: Pick<AuthUser, 'role'>): boolean =>
  user.role === Role.PROFESSOR;

export const isStudent = (user: Pick<AuthUser, 'role'>): boolean =>
  user.role === Role.STUDENT;

/**
 * Verdadeiro se o usuário é o professor responsável por uma turma.
 * Comparação por `userId`, não por role — um admin não é "dono" por si só.
 */
export const isClassOwner = (
  user: Pick<AuthUser, 'userId'>,
  classProfessorId: string,
): boolean => user.userId === classProfessorId;

/**
 * Regra de escrita em turma: apenas o professor dono OU um ADMIN.
 * Use nas rotas de `update`, `delete` e operações sensíveis (matrícula,
 * vincular tarefas, criar listas, etc.) antes de tocar o banco.
 */
export const ensureClassWriteAccess = (
  user: Pick<AuthUser, 'userId' | 'role'>,
  classProfessorId: string,
  message = 'Você não tem permissão para modificar esta turma',
): void => {
  if (!isClassOwner(user, classProfessorId) && !isAdmin(user)) {
    throw new ForbiddenException(message);
  }
};

/**
 * Regra genérica de posse: o recurso só pode ser modificado pelo criador
 * ou por um ADMIN. Usada, por exemplo, em `TaskService.update/delete`,
 * onde `resourceOwnerId` é o `creatorId` da tarefa.
 */
export const ensureResourceOwnership = (
  user: Pick<AuthUser, 'userId' | 'role'>,
  resourceOwnerId: string,
  message = 'Você não tem permissão para acessar este recurso',
): void => {
  if (user.userId !== resourceOwnerId && !isAdmin(user)) {
    throw new ForbiddenException(message);
  }
};
