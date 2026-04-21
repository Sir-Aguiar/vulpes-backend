import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restringe o handler às roles informadas. Avaliado pelo `RolesGuard`
 * global. Autorização "fina" (ownership, membership) é responsabilidade
 * do service, não deste decorator.
 *
 * @example
 * `@Roles(Role.PROFESSOR, Role.ADMIN)`
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
