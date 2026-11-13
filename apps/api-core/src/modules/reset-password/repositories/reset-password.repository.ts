import { ResetPasswordOrder } from '@prisma/client';

export abstract class ResetPasswordRepository {
  abstract createOrder(userId: string): Promise<ResetPasswordOrder>;
  abstract findOrderById(orderId: string): Promise<ResetPasswordOrder | null>;
  abstract deleteOrder(orderId: string): Promise<void>;
}
