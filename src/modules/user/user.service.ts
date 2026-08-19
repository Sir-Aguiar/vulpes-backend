import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { renderFile } from 'ejs';
import { resolve } from 'path';
import { AuthUser } from '../../common/types/auth-user.type';
import { EnvService } from '../../config/env.service';
import { EmailerService } from '../../infra/emailer/emailer.service';
import { GetUsersQueryDto, UserListItem } from './dto/get-users.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ChangePasswordDto, UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './repositories/user.repository';

/**
 * Template copiado para `dist/templates` no build (ver `nest-cli.json`).
 * Resolvido a partir de `__dirname` para funcionar tanto em dev quanto em
 * produção, já que ambos rodam a partir de `dist`.
 */

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailerService: EmailerService,
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
  ) {}

  /**
   * Atualiza os dados do usuário autenticado.
   *
   * - `name`: atualizado diretamente no banco.
   * - `email`: não é trocado aqui. Apenas dispara o email de confirmação
   *   para o novo endereço. A troca efetiva acontece quando o usuário
   *   acessa o link (fluxo de `verifyEmailLink`).
   */
  async update(user: AuthUser, data: UpdateUserDto): Promise<void> {
    if (data.name) {
      await this.userRepository.updateName(user.userId, data.name);
    }

    if (data.email) {
      await this.sendEmailChangeLink(user, data.email);
    }
  }

  /**
   * Gera o link de confirmação, renderiza o template e envia ao novo email.
   */
  private async sendEmailChangeLink(
    user: AuthUser,
    newEmail: string,
  ): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(newEmail);
    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    const link = this.generateEmailLink(user, newEmail);
    const resolvedPath = resolve('src', 'templates', 'change-email.ejs');
    const html = await renderFile(resolvedPath, { link });

    await this.emailerService.sendEmail({
      to: newEmail,
      subject: 'Confirme seu novo email',
      html,
    });
  }

  private generateEmailLink(user: AuthUser, newEmail: string): string {
    const { userId } = user;

    const token = this.jwtService.sign(
      { userId, newEmail },
      { expiresIn: '30m' },
    );

    const link = `${this.envService.get('HOST')}/user/verify-email-link/${Buffer.from(token).toString('base64url')}`;

    return link;
  }

  public async verifyEmailLink(token: string): Promise<string> {
    const decodedToken = Buffer.from(token, 'base64url').toString('utf-8');

    try {
      this.jwtService.verify(decodedToken);
    } catch {
      throw new UnauthorizedException('Token inválido');
    }

    const { userId, newEmail } = this.jwtService.decode(decodedToken);

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.userRepository.updateEmail(userId, newEmail);

    const resolvedPath = resolve('src', 'templates', 'email-verified.ejs');
    return renderFile(resolvedPath, { email: newEmail });
  }

  public async changePassword({ userId }: AuthUser, data: ChangePasswordDto) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new ForbiddenException('Senha atual inválida');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await this.userRepository.updatePassword(userId, hashedPassword);
  }

  async getUsers(
    query: GetUsersQueryDto,
  ): Promise<{ users: UserListItem[]; total: number }> {
    return this.userRepository.findMany(query);
  }

  async updateStatus(
    targetUserId: string,
    data: UpdateUserStatusDto,
    currentUser: AuthUser,
  ): Promise<void> {
    if (data.desativado && targetUserId === currentUser.userId) {
      throw new ForbiddenException('Você não pode desativar a própria conta');
    }

    const user = await this.userRepository.findById(targetUserId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.userRepository.setDesativado(targetUserId, data.desativado);
  }

  async deactivateUser({ userId }: AuthUser): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    try {
      await this.userRepository.deactivate(userId);
    } catch {
      throw new InternalServerErrorException('Falha ao desativar usuário');
    }
  }
}
