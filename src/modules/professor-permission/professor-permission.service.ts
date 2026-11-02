import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user.type';
import { changedFields } from '../audit/audit-diff';
import { AuditAction } from '../audit/audit.types';
import { AuditService } from '../audit/audit.service';
import { UserRepository } from '../user/repositories/user.repository';
import {
  CreateProfessorPermissionDto,
  RespondProfessorPermissionDto,
} from './dto/create-professor-permission.dto';
import { ProfessorPermissionRepository } from './repositories/professor-permission.repository';

@Injectable()
export class ProfessorPermissionService {
  constructor(
    private readonly repository: ProfessorPermissionRepository,
    private readonly userRepository: UserRepository,
    private readonly audit: AuditService,
  ) {}

  create(data: CreateProfessorPermissionDto) {
    return this.repository.create(data);
  }

  async getById(id: number) {
    const request = await this.repository.getById(id);
    if (!request) throw new NotFoundException('Solicitação não encontrada');
    return request;
  }

  getAll() {
    return this.repository.getAll();
  }

  /**
   * Responde a uma solicitação de promoção (APPROVED / REJECTED).
   *
   * Efeito colateral importante: ao APROVAR, se existir um usuário com
   * `personalEmail` igual ao da solicitação, ele é promovido à role
   * `PROFESSOR`. Se o usuário ainda não existe (cadastro futuro), a
   * aprovação fica registrada mas ninguém é promovido — o vínculo teria
   * que ser refeito manualmente. (Comportamento atual; pode ser revisitado.)
   */
  async respond(
    id: number,
    { requestStatus }: RespondProfessorPermissionDto,
    actor: AuthUser,
  ) {
    const current = await this.repository.getById(id);
    if (!current) throw new NotFoundException('Solicitação não encontrada');

    return this.audit.transaction(async (tx) => {
      const request = await this.repository.update(id, { requestStatus }, tx);

      const statusDiff = changedFields(
        { requestStatus: current.requestStatus },
        { requestStatus },
      );
      if (statusDiff) {
        await this.audit.record(
          {
            actor,
            action: AuditAction.professorPermissionDecided,
            entityType: 'ProfessorPermissionRequest',
            entityId: String(id),
            diff: statusDiff,
          },
          tx,
        );
      }

      if (requestStatus === 'APPROVED') {
        const user = await this.userRepository.findByEmail(
          request.personalEmail,
          tx,
        );
        const roleDiff = user
          ? changedFields({ role: user.role }, { role: Role.PROFESSOR })
          : null;
        if (user && roleDiff) {
          await this.userRepository.updateRole(user.userId, Role.PROFESSOR, tx);
          await this.audit.record(
            {
              actor,
              action: AuditAction.userRoleChanged,
              entityType: 'User',
              entityId: user.userId,
              diff: roleDiff,
            },
            tx,
          );
        }
      }

      return request;
    });
  }
}
