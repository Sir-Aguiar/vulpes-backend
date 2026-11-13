import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthUser } from '../types/auth-user.type';

/**
 * Extrai o usuário autenticado (`req.user`) populado pelo `JwtStrategy`
 * após validação do token. Use no lugar de ler `req.user` manualmente.
 *
 * Só faz sentido em handlers protegidos (não-`@Public`), onde o JWT já
 * foi validado — em rotas públicas o valor será `undefined`.
 */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthUser }>();
    return request.user;
  },
);
