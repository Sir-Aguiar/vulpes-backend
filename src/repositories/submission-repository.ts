import { Submission } from '@prisma/client';
import { ICreateSubmissionDTO } from '../dtos/Submission';
import { prisma } from '../database/prismaClient';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ApplicationError } from '../entities/errors/ApplicationError';

export abstract class SubmissionRepository {
  abstract create(data: ICreateSubmissionDTO): Promise<Submission>;
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
          500,
          `Erro ao criar submissão (Prisma ${error.code}): ${error.message}`,
        );
      }

      throw error;
    }
  }
}
