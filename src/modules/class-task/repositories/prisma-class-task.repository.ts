import { Injectable } from '@nestjs/common';
import { ClassTask, Prisma } from '@prisma/client';
import { ApplicationError } from '../../../common/errors/application.error';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CreateClassTaskDto } from '../dto/create-class-task.dto';
import { GetClassTasksQueryDto } from '../dto/get-class-tasks.dto';
import {
  ClassTaskRepository,
  ClassTaskWithRelations,
  IDashboardData,
} from './class-task.repository';

const TASK_INCLUDE = {
  task: {
    include: {
      taskParams: true,
      taskTests: true,
      creator: { select: { userId: true, name: true } },
    },
  },
} satisfies Prisma.ClassTaskInclude;

const CLASS_SELECT = {
  classId: true,
  name: true,
  code: true,
  professorId: true,
} satisfies Prisma.ClassSelect;

@Injectable()
export class PrismaClassTaskRepository implements ClassTaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClassTaskDto): Promise<ClassTask> {
    try {
      return await this.prisma.classTask.create({
        data: { classId: data.classId, taskId: data.taskId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ApplicationError(
            409,
            'Tarefa já está associada à turma',
            error,
          );
        }
        throw new ApplicationError(
          400,
          'Erro ao associar tarefa à turma',
          error,
        );
      }
      throw error;
    }
  }

  async createMany(
    classId: string,
    taskIds: string[],
  ): Promise<{ count: number }> {
    try {
      const result = await this.prisma.classTask.createMany({
        data: taskIds.map((taskId) => ({ classId, taskId })),
        skipDuplicates: true,
      });
      return { count: result.count };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao associar tarefas à turma',
          error,
        );
      }
      throw error;
    }
  }

  getById(classTaskId: string): Promise<ClassTaskWithRelations | null> {
    return this.prisma.classTask.findUnique({
      where: { classTaskId },
      include: { ...TASK_INCLUDE, class: { select: CLASS_SELECT } },
    });
  }

  getByIds(
    classId: string,
    taskId: string,
  ): Promise<ClassTaskWithRelations | null> {
    return this.prisma.classTask.findFirst({
      where: { classId, taskId },
      include: { ...TASK_INCLUDE, class: { select: CLASS_SELECT } },
    });
  }

  async getByClassId(
    classId: string,
    query: GetClassTasksQueryDto,
  ): Promise<{ classTasks: ClassTaskWithRelations[]; total: number }> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [classTasks, total] = await this.prisma.$transaction([
      this.prisma.classTask.findMany({
        where: { classId },
        include: TASK_INCLUDE,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.classTask.count({ where: { classId } }),
    ]);

    return { classTasks, total };
  }

  async delete(classId: string, taskId: string): Promise<void> {
    try {
      await this.prisma.classTask.deleteMany({
        where: { classId, taskId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao remover tarefa da turma',
          error,
        );
      }
      throw error;
    }
  }

  async isTaskInClass(classId: string, taskId: string): Promise<boolean> {
    const link = await this.prisma.classTask.findFirst({
      where: { classId, taskId },
    });
    return Boolean(link);
  }

  async deleteMany(
    classId: string,
    taskIds: string[],
  ): Promise<{ count: number }> {
    try {
      const result = await this.prisma.classTask.deleteMany({
        where: { classId, taskId: { in: taskIds } },
      });
      return { count: result.count };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao remover tarefas da turma',
          error,
        );
      }
      throw error;
    }
  }

  async getTasksInClass(classId: string, taskIds: string[]): Promise<string[]> {
    const items = await this.prisma.classTask.findMany({
      where: { classId, taskId: { in: taskIds } },
      select: { taskId: true },
    });
    return items.map((item) => item.taskId);
  }

  async getByClassIdAndTaskIds(
    classId: string,
    taskIds: string[],
  ): Promise<ClassTask[]> {
    return this.prisma.classTask.findMany({
      where: { classId, taskId: { in: taskIds } },
    });
  }

  getByTaskId(taskId: string): Promise<ClassTaskWithRelations[]> {
    return this.prisma.classTask.findMany({
      where: { taskId },
      include: { class: { select: CLASS_SELECT } },
    });
  }

  async getDashboardData(
    classId: string,
    taskId: string,
  ): Promise<IDashboardData> {
    const classStudents = await this.prisma.classStudent.findMany({
      where: { classId },
      include: { student: { select: { userId: true, name: true } } },
    });

    const studentIds = classStudents.map((student) => student.studentId);

    const classTask = await this.prisma.classTask.findFirst({
      where: { classId, taskId },
    });

    const submissions = await this.prisma.submission.findMany({
      where: {
        studentId: { in: studentIds },
        OR: [
          { taskId },
          ...(classTask
            ? [
                { classTaskId: classTask.classTaskId },
                {
                  classTaskList: { classTaskId: classTask.classTaskId },
                },
              ]
            : []),
        ],
      },
      orderBy: { submittedAt: 'desc' },
      select: {
        submissionId: true,
        studentId: true,
        code: true,
        isCorrect: true,
        submittedAt: true,
        professorComments: true,
      },
    });

    const result: IDashboardData = { students: [] };

    for (const student of classStudents) {
      const lastSubmission = submissions.find(
        (submission) => submission.studentId === student.studentId,
      )!;

      result.students.push({
        studentId: student.studentId,
        name: student.student.name,
        lastSubmission: {
          submissionId: lastSubmission.submissionId,
          isCorrect: lastSubmission.isCorrect,
          submittedAt: lastSubmission.submittedAt,
          code: lastSubmission.code,
          professorComments: lastSubmission.professorComments,
        },
      });
    }

    return result;
  }
}
