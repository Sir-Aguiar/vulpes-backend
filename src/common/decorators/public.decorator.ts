import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca um handler (ou controller inteiro) como público, dispensando o
 * `JwtAuthGuard` global. Use com parcimônia — o default do app é "tudo
 * exige autenticação".
 *
 * Exemplos legítimos: `GET /` (healthcheck), `POST /auth/login`,
 * `POST /auth/signup`, `GET /institution`.
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
