import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

export const dbOf = (prisma: PrismaService, tx?: Prisma.TransactionClient) =>
  tx ?? prisma;
