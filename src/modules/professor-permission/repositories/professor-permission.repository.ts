import { ProfessorPermissionRequest } from '@prisma/client';
import { CreateProfessorPermissionDto } from '../dto/create-professor-permission.dto';

export abstract class ProfessorPermissionRepository {
  abstract create(
    data: CreateProfessorPermissionDto,
  ): Promise<ProfessorPermissionRequest>;
  abstract getById(id: number): Promise<ProfessorPermissionRequest | null>;
  abstract getAll(): Promise<ProfessorPermissionRequest[]>;
  abstract update(
    id: number,
    data: Partial<ProfessorPermissionRequest>,
  ): Promise<ProfessorPermissionRequest>;
}
