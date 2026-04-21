import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../user/repositories/user.repository';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const PASSWORD_HASH_ROUNDS = 10;

export interface AuthResponse {
  access_token: string;
  user: {
    userId: string;
    email: string;
    name: string;
    role: Role;
    institutionId: number | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Cria um novo usuário e já retorna um JWT válido (login implícito
   * após cadastro). A role é forçada a `STUDENT` — não importa o que
   * o cliente enviou. Promoção a `PROFESSOR` passa obrigatoriamente
   * pelo fluxo de `ProfessorPermission`.
   */
  async signup(data: SignupDto): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    const hashedPassword = await bcrypt.hash(
      data.password,
      PASSWORD_HASH_ROUNDS,
    );

    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
      role: Role.STUDENT,
    });

    return this.buildAuthResponse(user);
  }

  /**
   * Mensagem genérica "Credenciais inválidas" para ambos os casos
   * (usuário inexistente e senha errada) para não facilitar enumeração
   * de emails válidos.
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: User): AuthResponse {
    const payload: JwtPayload = {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        institutionId: user.institutionId,
      },
    };
  }
}
