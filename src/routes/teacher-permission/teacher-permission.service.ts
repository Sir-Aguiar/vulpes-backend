import { Injectable } from '@nestjs/common';
import { TeacherPermissionRepository } from '../../repositories/teacher-permission-repository';
import { ICreateTeacherPermissionDTO } from '../../dtos/TeacherPermission';

@Injectable()
export class TeacherPermissionService {
  constructor(private readonly repository: TeacherPermissionRepository) {}

  async create(data: ICreateTeacherPermissionDTO) {
    return this.repository.create(data);
  }
}
