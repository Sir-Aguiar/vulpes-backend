import { Injectable } from '@nestjs/common';
import { Prisma, Submission } from '@prisma/client';
import { ApplicationError } from '../../../common/errors/application.error';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  CreateSubmissionData,
  SubmissionRepository,
  SubmissionWithRelations,
} from './submission.repository';

const STUDENT_INCLUDE = {
  student: {
    select: { userId: true, email: true, name: true, institution: true },
  },
} satisfies Prisma.SubmissionInclude;

@Injectable()
export class PrismaSubmissionRepository implements SubmissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSubmissionData): Promise<Submission> {
    try {
      return await this.prisma.submission.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(400, 'Erro ao criar submissão', error);
      }
      throw error;
    }
  }

  async getByTaskId(taskId: string): Promise<SubmissionWithRelations[]> {
    try {
      return await this.prisma.submission.findMany({
        where: { taskId },
        include: STUDENT_INCLUDE,
        orderBy: { submittedAt: 'desc' },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao buscar submissões da tarefa',
          error,
        );
      }
      throw error;
    }
  }

  async getByListId(listId: string): Promise<SubmissionWithRelations[]> {
    try {
      return await this.prisma.submission.findMany({
        where: { listId },
        include: STUDENT_INCLUDE,
        orderBy: { submittedAt: 'desc' },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao buscar submissões da lista',
          error,
        );
      }
      throw error;
    }
  }

  async getFeedbacks(
    studentId: string,
    isWidget: boolean = false,
  ): Promise<SubmissionWithRelations[]> {
    const include: Prisma.SubmissionInclude = {
      task: true,
    };

    if (isWidget) {
      include.task = {
        select: { taskId: true, title: true } satisfies Prisma.TaskSelect,
      };
    }

    try {
      return await this.prisma.submission.findMany({
        where: { studentId, professorComments: { not: null } },
        include,
        orderBy: { updatedAt: 'desc' },
        take: isWidget ? 5 : undefined,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(400, 'Erro ao buscar feedbacks', error);
      }
      throw error;
    }
  }

  async update(
    submissionId: string,
    data: Partial<Submission>,
  ): Promise<Submission> {
    try {
      return await this.prisma.submission.update({
        where: { submissionId },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ApplicationError(404, 'Submissão não encontrada', error);
        }
        throw new ApplicationError(400, 'Erro ao atualizar submissão', error);
      }
      throw error;
    }
  }
}
