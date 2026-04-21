import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvService } from '../../../config/env.service';
import { AuthUser } from '../../../common/types/auth-user.type';
import { UserRepository } from '../../user/repositories/user.repository';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * Valida o JWT e rematerializa o usuário a partir do banco.
 *
 * Por que buscar no banco em vez de confiar só no payload: a role e os
 * dados podem mudar entre dois tokens (promoção a professor, mudança de
 * instituição). Se confiássemos só no JWT, um estudante recém-promovido
 * continuaria "estudante" até renovar o token. O custo de uma consulta
 * extra por request foi considerado aceitável pelo projeto.
 *
 * O objeto retornado é anexado a `req.user` — é o que `@CurrentUser()`
 * devolve nos controllers.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userRepository: UserRepository,
    envService: EnvService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.userRepository.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      institutionId: user.institutionId,
    };
  }
}
