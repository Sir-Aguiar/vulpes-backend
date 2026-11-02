import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { NewAuditEvent } from './audit.types';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  record(
    event: NewAuditEvent,
    tx?: Prisma.TransactionClient,
  ): Promise<unknown> {
    const db = tx ?? this.prisma;
    return db.auditEvent.create({
      data: {
        actorId: event.actor.userId,
        actorRole: event.actor.role,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        diff: event.diff,
      },
    });
  }
}
