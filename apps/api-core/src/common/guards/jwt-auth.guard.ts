import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard global (registrado em `AppModule` como `APP_GUARD`).
 *
 * Bloqueia toda requisição que não apresentar um JWT válido no header
 * `Authorization: Bearer <token>`. A única forma de liberar um handler
 * é anotá-lo (ou seu controller) com `@Public()`.
 *
 * Ordem de execução: este guard roda antes do `RolesGuard` — ou seja,
 * o `req.user` já está populado pelo `JwtStrategy.validate` quando o
 * `RolesGuard` avalia a role.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
