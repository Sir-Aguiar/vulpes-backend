import { Injectable } from '@nestjs/common';
import { Prisma, Submission } from '@prisma/client';
import { ApplicationError } from '../../../common/errors/application.error';
import { dbOf } from '../../../infra/prisma/db';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  CreateSubmissionData,
  SubmissionFeedbackContext,
  SubmissionRepository,
  SubmissionWithRelations,
} from './submission.repository';

const STUDENT_INCLUDE = {
  student: {
    select: { userId: true, email: true, name: true, institution: true },
  },
} satisfies Prisma.SubmissionInclude;

const FULL_INCLUDE = {
  ...STUDENT_INCLUDE,
  task: { select: { taskId: true, title: true } },
  classTask: { include: { task: { select: { taskId: true, title: true } } } },
  classTaskList: {
    include: {
      classTask: {
        include: { task: { select: { taskId: true, title: true } } },
      },
    },
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

  async getByClassTaskId(
    classTaskId: string,
  ): Promise<SubmissionWithRelations[]> {
    try {
      return await this.prisma.submission.findMany({
        where: { classTaskId },
        include: STUDENT_INCLUDE,
        orderBy: { submittedAt: 'desc' },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao buscar submissões da tarefa na turma',
          error,
        );
      }
      throw error;
    }
  }

  async getByClassTaskListId(
    classTaskListId: string,
  ): Promise<SubmissionWithRelations[]> {
    try {
      return await this.prisma.submission.findMany({
        where: { classTaskListId },
        include: STUDENT_INCLUDE,
        orderBy: { submittedAt: 'desc' },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao buscar submissões da tarefa na lista',
          error,
        );
      }
      throw error;
    }
  }

  async countByStudentAndClassTaskListId(
    studentId: string,
    classTaskListId: string,
  ): Promise<number> {
    return this.prisma.submission.count({
      where: { studentId, classTaskListId },
    });
  }

  async getFeedbackContext(
    submissionId: string,
  ): Promise<SubmissionFeedbackContext | null> {
    // Busca o professorId da tarefa ou da lista de tarefas
    const submission = await this.prisma.submission.findUnique({
      where: { submissionId },
      select: {
        professorComments: true,
        classTask: {
          select: { class: { select: { professorId: true } } },
        },
        classTaskList: {
          select: {
            list: { select: { class: { select: { professorId: true } } } },
          },
        },
      },
    });

    if (!submission) return null;

    const professorId =
      submission.classTaskList?.list.class.professorId ??
      submission.classTask?.class.professorId ??
      null;

    return { professorId, professorComments: submission.professorComments };
  }

  async getFeedbacks(
    studentId: string,
    isWidget: boolean = false,
  ): Promise<SubmissionWithRelations[]> {
    const include: Prisma.SubmissionInclude = isWidget
      ? {
          task: { select: { taskId: true, title: true } },
          classTask: {
            include: { task: { select: { taskId: true, title: true } } },
          },
          classTaskList: {
            include: {
              classTask: {
                include: { task: { select: { taskId: true, title: true } } },
              },
            },
          },
        }
      : FULL_INCLUDE;

    try {
      return (await this.prisma.submission.findMany({
        where: { studentId, professorComments: { not: null } },
        include,
        orderBy: { updatedAt: 'desc' },
        take: isWidget ? 5 : undefined,
      })) as unknown as SubmissionWithRelations[];
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
    tx?: Prisma.TransactionClient,
  ): Promise<Submission> {
    try {
      return await dbOf(this.prisma, tx).submission.update({
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
