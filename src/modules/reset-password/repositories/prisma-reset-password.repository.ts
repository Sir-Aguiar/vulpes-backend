import { Injectable } from '@nestjs/common';
import { ResetPasswordOrder } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { ResetPasswordRepository } from './reset-password.repository';

@Injectable()
export class PrismaResetPasswordRepository implements ResetPasswordRepository {
  constructor(private readonly prisma: PrismaService) {}

  createOrder(userId: string): Promise<ResetPasswordOrder> {
    return this.prisma.resetPasswordOrder.create({ data: { userId } });
  }

  findOrderById(orderId: string): Promise<ResetPasswordOrder | null> {
    return this.prisma.resetPasswordOrder.findUnique({ where: { orderId } });
  }

  deleteOrder(orderId: string): Promise<void> {
    return this.prisma.resetPasswordOrder
      .delete({ where: { orderId } })
      .then(() => undefined);
  }
}
