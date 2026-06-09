import { Injectable } from '@nestjs/common';
import { BugReport, Prisma } from '@prisma/client';
import { ApplicationError } from '../../../common/errors/application.error';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CreateBugReportInput } from '../dto/create-bug-report.dto';
import { UpdateBugReportInput } from '../dto/update-bug-report.dto';
import {
  BugReportRepository,
  BugReportWithUser,
} from './bug-report.repository';

const userSelect = {
  userId: true,
  name: true,
  email: true,
  role: true,
} as const;

@Injectable()
export class PrismaBugReportRepository implements BugReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBugReportInput): Promise<BugReport> {
    try {
      return await this.prisma.bugReport.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(400, 'Erro ao criar report de bug', error);
      }

      throw error;
    }
  }

  getById(id: number): Promise<BugReportWithUser | null> {
    return this.prisma.bugReport.findUnique({
      where: { bugReportId: id },
      include: { user: { select: userSelect } },
    });
  }

  getAll(): Promise<BugReportWithUser[]> {
    return this.prisma.bugReport.findMany({
      include: { user: { select: userSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: number,
    data: UpdateBugReportInput,
  ): Promise<BugReportWithUser> {
    try {
      return await this.prisma.bugReport.update({
        where: { bugReportId: id },
        data,
        include: { user: { select: userSelect } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ApplicationError(
            404,
            'Report de bug não encontrado',
            error,
          );
        }
        throw new ApplicationError(
          400,
          'Erro ao atualizar report de bug',
          error,
        );
      }
      throw error;
    }
  }
}
