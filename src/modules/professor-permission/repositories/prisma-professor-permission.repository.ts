import { Injectable } from '@nestjs/common';
import { Prisma, ProfessorPermissionRequest } from '@prisma/client';
import { ApplicationError } from '../../../common/errors/application.error';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CreateProfessorPermissionDto } from '../dto/create-professor-permission.dto';
import { ProfessorPermissionRepository } from './professor-permission.repository';

@Injectable()
export class PrismaProfessorPermissionRepository implements ProfessorPermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateProfessorPermissionDto,
  ): Promise<ProfessorPermissionRequest> {
    try {
      return await this.prisma.professorPermissionRequest.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao criar solicitação de professor',
          error,
        );
      }
      throw error;
    }
  }

  getById(id: number): Promise<ProfessorPermissionRequest | null> {
    return this.prisma.professorPermissionRequest.findUnique({
      where: { professorPermissionRequestId: id },
      include: { institution: true },
    });
  }

  getAll(): Promise<ProfessorPermissionRequest[]> {
    return this.prisma.professorPermissionRequest.findMany({
      include: { institution: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: number,
    data: Partial<ProfessorPermissionRequest>,
  ): Promise<ProfessorPermissionRequest> {
    try {
      return await this.prisma.professorPermissionRequest.update({
        where: { professorPermissionRequestId: id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ApplicationError(404, 'Solicitação não encontrada', error);
        }
        throw new ApplicationError(400, 'Erro ao atualizar solicitação', error);
      }
      throw error;
    }
  }
}
