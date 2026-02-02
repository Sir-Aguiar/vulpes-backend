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
  abstract getByIds(
    classId: string,
    taskId: string,
  ): Promise<IClassTaskWithRelations | null>;
  abstract getByClassId(
    classId: string,
    query: IGetClassTasksQuery,
  ): Promise<{ classTasks: IClassTaskWithRelations[]; total: number }>;
  abstract delete(classId: string, taskId: string): Promise<void>;
  abstract isTaskInClass(classId: string, taskId: string): Promise<boolean>;
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
}
