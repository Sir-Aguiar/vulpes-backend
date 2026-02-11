import { Submission } from '@prisma/client';
import { ICreateSubmissionDTO } from '../dtos/Submission';
import { prisma } from '../database/prismaClient';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ApplicationError } from '../entities/errors/ApplicationError';

export abstract class SubmissionRepository {
  abstract create(data: ICreateSubmissionDTO): Promise<Submission>;
  abstract getSubmissionsByTaskId(taskId: string): Promise<Submission[]>;
  abstract update(id: string, data: Partial<Submission>): Promise<Submission>;
}

export class PrismaSubmissionRepository implements SubmissionRepository {
  async create(data: ICreateSubmissionDTO): Promise<Submission> {
    try {
      return await prisma.submission.create({
        data,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          `Erro ao criar submissão (Prisma ${error.code}): ${error.message}`,
        );
      }

      throw error;
    }
  }

  async getSubmissionsByTaskId(taskId: string): Promise<Submission[]> {
    try {
      return await prisma.submission.findMany({
        where: { taskId },
        include: {
          student: {
            select: {
              userId: true,
              email: true,
              name: true,
              institution: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          `Erro ao buscar submissões por taskId (Prisma ${error.code}): ${error.message}`,
        );
      }

      throw error;
    }
  }

  async update(
    submissionId: string,
    data: Partial<Submission>,
  ): Promise<Submission> {
    try {
      return await prisma.submission.update({
        where: { submissionId },
        data,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          `Erro ao atualizar submissão (Prisma ${error.code}): ${error.message}`,
        );
      }
      throw error;
    }
  }
}
