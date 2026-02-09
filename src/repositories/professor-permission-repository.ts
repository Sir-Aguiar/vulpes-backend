import { ProfessorPermissionRequest } from '@prisma/client';
import { ICreateProfessorPermissionDTO } from '../dtos/ProfessorPermission';
import { prisma } from '../database/prismaClient';

export abstract class ProfessorPermissionRepository {
  abstract create(
    data: ICreateProfessorPermissionDTO,
  ): Promise<ProfessorPermissionRequest>;

  abstract getById(id: number): Promise<ProfessorPermissionRequest | null>;

  abstract getAll(): Promise<ProfessorPermissionRequest[]>;

  abstract update(
    id: number,
    data: Partial<ProfessorPermissionRequest>,
  ): Promise<ProfessorPermissionRequest>;
}

export class PrismaProfessorPermissionRepository implements ProfessorPermissionRepository {
  async create(
    data: ICreateProfessorPermissionDTO,
  ): Promise<ProfessorPermissionRequest> {
    return await prisma.professorPermissionRequest.create({
      data,
    });
  }

  async getById(id: number): Promise<ProfessorPermissionRequest | null> {
    return await prisma.professorPermissionRequest.findUnique({
      where: { professorPermissionRequestId: id },
      include: { institution: true },
    });
  }

  async getAll(): Promise<ProfessorPermissionRequest[]> {
    return await prisma.professorPermissionRequest.findMany({
      include: { institution: true },
    });
  }

  async update(
    id: number,
    data: Partial<ProfessorPermissionRequest>,
  ): Promise<ProfessorPermissionRequest> {
    return await prisma.professorPermissionRequest.update({
      where: { professorPermissionRequestId: id },
      data,
    });
  }
}
