import { Injectable } from '@nestjs/common';
import { ProfessorPermissionRepository } from '../../repositories/professor-permission-repository';
import { ICreateProfessorPermissionDTO } from '../../dtos/ProfessorPermission';
import { UserRepository } from '../../repositories/user-repository';
import { Role } from '@prisma/client';

@Injectable()
export class ProfessorPermissionService {
  constructor(
    private readonly repository: ProfessorPermissionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async create(data: ICreateProfessorPermissionDTO) {
    return this.repository.create(data);
  }

  async getById(id: number) {
    return this.repository.getById(id);
  }

  async getAll() {
    return this.repository.getAll();
  }

  async respond(id: number, data: { requestStatus: 'APPROVED' | 'REJECTED' }) {
    const request = await this.repository.update(id, data);

    if (data.requestStatus === 'APPROVED') {
      const user = await this.userRepository.findByEmail(request.personalEmail);
      if (user) {
        await this.userRepository.updateRole(user.userId, Role.PROFESSOR);
      }
    }

    return request;
  }
}
