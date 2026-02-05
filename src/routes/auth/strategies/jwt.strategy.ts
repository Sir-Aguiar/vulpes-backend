import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from '../../../repositories/user-repository';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userRepository: UserRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JwtStrategy.getJwtSecret(),
    });
  }

  private static getJwtSecret(): string {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    return jwtSecret;
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      institution: user.institution,
    };
  }
}
