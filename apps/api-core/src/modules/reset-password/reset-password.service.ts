import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { renderFile } from 'ejs';
import { resolve } from 'path';
import { EnvService } from '../../config/env.service';
import { EmailerService } from '../../infra/emailer/emailer.service';
import { UserRepository } from '../user/repositories/user.repository';
import { ConfirmResetDto } from './dto/confirm-reset.dto';
import { ResetPasswordRepository } from './repositories/reset-password.repository';
import { ResetPasswordOrder } from '@prisma/client';
const PASSWORD_HASH_ROUNDS = 10;

interface ResetTokenPayload {
  orderId: string;
}

@Injectable()
export class ResetPasswordService {
  constructor(
    private readonly resetPasswordRepository: ResetPasswordRepository,
    private readonly userRepository: UserRepository,
    private readonly emailerService: EmailerService,
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
  ) {}

  /**
   * Solicita a troca de senha. Cria a ordem, gera o link JWT e envia o email.
   *
   * Mesmo quando o email não é encontrado retorna sem erro para não expor
   * quais emails estão cadastrados (enumeração de usuários).
   */
  async requestReset(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) return;

    const order = await this.createOrder(user.userId);

    const link = this.generateEmailLink(order.orderId);

    const html = await renderFile(
      resolve('src', 'templates', 'reset-password.ejs'),
      { link },
    );

    await this.emailerService.sendEmail({
      to: email,
      subject: 'Redefinição de senha',
      html,
    });
  }

  private async createOrder(userId: string): Promise<ResetPasswordOrder> {
    return this.resetPasswordRepository.createOrder(userId);
  }

  private generateEmailLink(orderId: string): string {
    const token = this.jwtService.sign(
      { orderId } satisfies ResetTokenPayload,
      { expiresIn: '30m' },
    );

    const encodedToken = Buffer.from(token).toString('base64url');

    return `${this.envService.get('FRONTEND_HOST')}/validate-order?token=${encodedToken}`;
  }

  /**
   * Valida o token JWT e confirma que a ordem ainda existe no banco.
   * Retorna o `orderId` para o frontend usar na etapa de confirmação.
   */
  async verifyLink(encodedToken: string): Promise<{ orderId: string }> {
    const token = Buffer.from(encodedToken, 'base64url').toString('utf-8');

    let payload: ResetTokenPayload;

    try {
      payload = this.jwtService.verify<ResetTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Link inválido ou expirado');
    }

    const order = await this.resetPasswordRepository.findOrderById(
      payload.orderId,
    );

    if (!order) {
      throw new NotFoundException('Ordem de troca de senha não encontrada');
    }

    return { orderId: order.orderId };
  }

  /**
   * Aplica a nova senha. Busca o usuário pela ordem, faz o hash e atualiza.
   * Ao final, deleta a ordem para que o link não possa ser reutilizado.
   */
  async confirmReset(data: ConfirmResetDto): Promise<void> {
    const order = await this.resetPasswordRepository.findOrderById(
      data.orderId,
    );

    if (!order) {
      throw new NotFoundException('Ordem de troca de senha não encontrada');
    }

    const hashedPassword = await bcrypt.hash(
      data.password,
      PASSWORD_HASH_ROUNDS,
    );

    await this.userRepository.updatePassword(order.userId, hashedPassword);
    await this.resetPasswordRepository.deleteOrder(order.orderId);
  }
}
