import { Injectable } from '@nestjs/common';
import { prisma } from '../database/prismaClient';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ApplicationError } from '../entities/errors/ApplicationError';
import {
  ICreateClassTaskListDTO,
  IGetClassTaskListsQuery,
} from '../dtos/ClassTaskList';
import { TaskList } from '@prisma/client';

export interface IClassTaskListWithRelations extends TaskList {
  task?: {
    taskId: string;
    title: string;
    description: string;
    isVisible: boolean;
    isPublic: boolean;
    taskParams?: any[];
    taskTests?: any[];
  };
  list?: {
    listId: string;
    title: string;
    deadline: Date;
    submissionLimit: number | null;
    classId: string;
  };
}

export abstract class TaskListRepository {
  abstract create(data: ICreateClassTaskListDTO): Promise<TaskList>;
  abstract createMany(
    listId: string,
    taskIds: string[],
  ): Promise<{ count: number }>;
  abstract getByIds(
    taskId: string,
    listId: string,
  ): Promise<IClassTaskListWithRelations | null>;
  abstract getByListId(
    listId: string,
    query: IGetClassTaskListsQuery,
  ): Promise<{ classTaskLists: IClassTaskListWithRelations[]; total: number }>;
  abstract delete(taskId: string, listId: string): Promise<void>;
  abstract deleteMany(
    listId: string,
    taskIds: string[],
  ): Promise<{ count: number }>;
}

@Injectable()
export class PrismaClassTaskListRepository implements TaskListRepository {
  async create(data: ICreateClassTaskListDTO): Promise<TaskList> {
    try {
      return await prisma.taskList.create({
        data: {
          taskId: data.taskId,
          listId: data.listId,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ApplicationError(
            409,
            'Tarefa já está associada a esta lista',
            error,
          );
        }
        throw new ApplicationError(
          400,
          'Erro ao associar tarefa à lista',
          error,
        );
      }
      throw error;
    }
  }

  async createMany(
    listId: string,
    taskIds: string[],
  ): Promise<{ count: number }> {
    try {
      const result = await prisma.taskList.createMany({
        data: taskIds.map((taskId) => ({ taskId, listId })),
        skipDuplicates: true,
      });
      return { count: result.count };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao associar tarefas à lista',
          error,
        );
      }
      throw error;
    }
  }

  async getByIds(
    taskId: string,
    listId: string,
  ): Promise<IClassTaskListWithRelations | null> {
    return await prisma.taskList.findUnique({
      where: {
        taskId_listId: { taskId, listId },
      },
      include: {
        task: {
          include: {
            taskParams: true,
            taskTests: true,
          },
        },
        list: true,
      },
    });
  }

  async getByListId(
    listId: string,
    query: IGetClassTaskListsQuery,
  ): Promise<{ classTaskLists: IClassTaskListWithRelations[]; total: number }> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [classTaskLists, total] = await Promise.all([
      prisma.taskList.findMany({
        where: { listId },
        include: {
          task: {
            include: {
              taskParams: true,
              taskTests: true,
            },
          },
          list: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.taskList.count({ where: { listId } }),
    ]);

    return { classTaskLists, total };
  }

  async delete(taskId: string, listId: string): Promise<void> {
    try {
      await prisma.taskList.delete({
        where: {
          taskId_listId: { taskId, listId },
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ApplicationError(
            404,
            'Tarefa não encontrada na lista',
            error,
          );
        }
        throw new ApplicationError(
          400,
          'Erro ao remover tarefa da lista',
          error,
        );
      }
      throw error;
    }
  }

  async deleteMany(
    listId: string,
    taskIds: string[],
  ): Promise<{ count: number }> {
    try {
      const result = await prisma.taskList.deleteMany({
        where: {
          listId,
          taskId: { in: taskIds },
        },
      });
      return { count: result.count };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao remover tarefas da lista',
          error,
        );
      }
      throw error;
    }
  }
}
