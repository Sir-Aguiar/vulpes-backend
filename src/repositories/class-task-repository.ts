import { Injectable } from '@nestjs/common';
import { prisma } from '../database/prismaClient';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ApplicationError } from '../entities/errors/ApplicationError';
import { ICreateClassTaskDTO, IGetClassTasksQuery } from '../dtos/ClassTask';
import { ClassTask, Task } from '@prisma/client';

export interface IClassTaskWithRelations extends ClassTask {
  task?: Task & {
    taskParams?: any[];
    taskTests?: any[];
    creator?: {
      userId: string;
      name: string;
    };
  };
  class?: {
    classId: string;
    name: string;
    code: number;
    professorId: string;
  };
}

export abstract class ClassTaskRepository {
  abstract create(data: ICreateClassTaskDTO): Promise<ClassTask>;
  abstract createMany(
    classId: string,
    taskIds: string[],
  ): Promise<{ count: number }>;
  abstract getByIds(
    classId: string,
    taskId: string,
  ): Promise<IClassTaskWithRelations | null>;
  abstract getByClassId(
    classId: string,
    query: IGetClassTasksQuery,
  ): Promise<{ classTasks: IClassTaskWithRelations[]; total: number }>;
  abstract getByTaskId(taskId: string): Promise<IClassTaskWithRelations[]>;
  abstract delete(classId: string, taskId: string): Promise<void>;
  abstract deleteMany(
    classId: string,
    taskIds: string[],
  ): Promise<{ count: number }>;
  abstract isTaskInClass(classId: string, taskId: string): Promise<boolean>;
  abstract getTasksInClass(
    classId: string,
    taskIds: string[],
  ): Promise<string[]>;
}

@Injectable()
export class PrismaClassTaskRepository implements ClassTaskRepository {
  async create(data: ICreateClassTaskDTO): Promise<ClassTask> {
    try {
      return await prisma.classTask.create({
        data: {
          classId: data.classId,
          taskId: data.taskId,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
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
      const result = await prisma.classTask.createMany({
        data: taskIds.map((taskId) => ({ classId, taskId })),
        skipDuplicates: true,
      });
      return { count: result.count };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao associar tarefas à turma',
          error,
        );
      }
      throw error;
    }
  }

  async getByIds(
    classId: string,
    taskId: string,
  ): Promise<IClassTaskWithRelations | null> {
    return await prisma.classTask.findUnique({
      where: {
        classId_taskId: { classId, taskId },
      },
      include: {
        task: {
          include: {
            taskParams: true,
            taskTests: true,
            creator: {
              select: {
                userId: true,
                name: true,
              },
            },
          },
        },
        class: {
          select: {
            classId: true,
            name: true,
            code: true,
            professorId: true,
          },
        },
      },
    });
  }

  async getByClassId(
    classId: string,
    query: IGetClassTasksQuery,
  ): Promise<{ classTasks: IClassTaskWithRelations[]; total: number }> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [classTasks, total] = await Promise.all([
      prisma.classTask.findMany({
        where: { classId },
        include: {
          task: {
            include: {
              taskParams: true,
              taskTests: true,
              creator: {
                select: {
                  userId: true,
                  name: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.classTask.count({ where: { classId } }),
    ]);

    return { classTasks, total };
  }

  async delete(classId: string, taskId: string): Promise<void> {
    try {
      await prisma.classTask.delete({
        where: {
          classId_taskId: { classId, taskId },
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
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
    const classTask = await prisma.classTask.findUnique({
      where: {
        classId_taskId: { classId, taskId },
      },
    });
    return !!classTask;
  }

  async deleteMany(
    classId: string,
    taskIds: string[],
  ): Promise<{ count: number }> {
    try {
      const result = await prisma.classTask.deleteMany({
        where: {
          classId,
          taskId: { in: taskIds },
        },
      });
      return { count: result.count };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
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
    const classTasks = await prisma.classTask.findMany({
      where: {
        classId,
        taskId: { in: taskIds },
      },
      select: { taskId: true },
    });
    return classTasks.map((ct) => ct.taskId);
  }

  async getByTaskId(taskId: string): Promise<IClassTaskWithRelations[]> {
    return await prisma.classTask.findMany({
      where: { taskId },
      include: {
        class: {
          select: {
            classId: true,
            name: true,
            code: true,
            professorId: true,
          },
        },
      },
    });
  }
}
