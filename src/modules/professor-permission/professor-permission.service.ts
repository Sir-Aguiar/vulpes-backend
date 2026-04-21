import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
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
  async respond(id: number, { requestStatus }: RespondProfessorPermissionDto) {
    const request = await this.repository.update(id, { requestStatus });

    if (requestStatus === 'APPROVED') {
      const user = await this.userRepository.findByEmail(request.personalEmail);
      if (user) {
        await this.userRepository.updateRole(user.userId, Role.PROFESSOR);
      }
    }

    return request;
  }
}
