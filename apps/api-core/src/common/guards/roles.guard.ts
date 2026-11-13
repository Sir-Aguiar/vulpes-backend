import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../types/auth-user.type';

/**
 * Guard global (registrado em `AppModule` como `APP_GUARD`), roda *depois*
 * do `JwtAuthGuard`. Responsabilidade: restringir handlers a um conjunto
 * de roles declarado via `@Roles(...)`.
 *
 * Regras:
 * - Handlers sem `@Roles` passam (autorização baseada apenas em JWT).
 * - Se `req.user` não existe (ex.: rota pública que foi marcada com @Roles
 *   por engano), lança 403 em vez de permitir.
 * - Autorizações mais granulares (ex.: "só o professor dono desta turma")
 *   *não* são feitas aqui — ficam no service, usando os helpers em
 *   `common/authorization/authorization.helpers.ts`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Acesso negado. Requer uma das seguintes roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
