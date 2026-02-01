import { Injectable } from '@nestjs/common';
import { ProfessorPermissionRepository } from '../../repositories/professor-permission-repository';
import { ICreateProfessorPermissionDTO } from '../../dtos/ProfessorPermission';
@Injectable()
export class ProfessorPermissionService {
  constructor(private readonly repository: ProfessorPermissionRepository) {}

  async create(data: ICreateProfessorPermissionDTO) {
    return this.repository.create(data);
  }

  async getById(id: number) {
    return this.repository.getById(id);
  }

  async respond(id: number, data: { requestStatus: 'APPROVED' | 'REJECTED' }) {
    return this.repository.update(id, data);
  }
}
