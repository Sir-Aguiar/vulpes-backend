import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvService } from '../../../config/env.service';
import { AuthUser } from '../../../common/types/auth-user.type';
import { parseStoredUserPreferences } from '../../user/dto/user-preferences.dto';
import type { UserPreferences } from '../../user/dto/user-preferences.dto';
import { UserRepository } from '../../user/repositories/user.repository';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  userPreferences: UserPreferences;
}

/**
 * Valida o JWT e rematerializa o usuário a partir do banco.
 *
 * Por que buscar no banco em vez de confiar só no payload: a role, as
 * preferências e os demais dados podem mudar entre dois tokens. O token
 * carrega `userPreferences` no login, mas `req.user` usa o JSON atual do
 * banco. O custo de uma consulta extra por request foi considerado
 * aceitável pelo projeto.
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

    if (user.desativado) {
      throw new UnauthorizedException('Conta desativada');
    }

    return {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      institutionId: user.institutionId,
      userPreferences: parseStoredUserPreferences(user.userPreferences),
    };
  }
}
