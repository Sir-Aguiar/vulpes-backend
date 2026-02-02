import { Injectable } from '@nestjs/common';
import { prisma } from '../database/prismaClient';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ApplicationError } from '../entities/errors/ApplicationError';
import {
  ICreateClassTaskListDTO,
  IGetClassTaskListsQuery,
} from '../dtos/ClassTaskList';
import { ClassTaskList } from '@prisma/client';

export interface IClassTaskListWithRelations extends ClassTaskList {
  classTask?: {
    classId: string;
    taskId: string;
    task?: {
      taskId: string;
      title: string;
      description: string;
      isVisible: boolean;
      isPublic: boolean;
      taskParams?: any[];
      taskTests?: any[];
    };
  };
  list?: {
    listId: string;
    title: string;
    deadline: Date;
    submissionLimit: number | null;
    classId: string;
  };
}

export abstract class ClassTaskListRepository {
  abstract create(data: ICreateClassTaskListDTO): Promise<ClassTaskList>;
  abstract getByIds(
    classId: string,
    taskId: string,
    listId: string,
  ): Promise<IClassTaskListWithRelations | null>;
  abstract getByListId(
    listId: string,
    query: IGetClassTaskListsQuery,
  ): Promise<{ classTaskLists: IClassTaskListWithRelations[]; total: number }>;
  abstract delete(
    classId: string,
    taskId: string,
    listId: string,
  ): Promise<void>;
}

@Injectable()
export class PrismaClassTaskListRepository implements ClassTaskListRepository {
  async create(data: ICreateClassTaskListDTO): Promise<ClassTaskList> {
    try {
      return await prisma.classTaskList.create({
        data: {
          classId: data.classId,
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

  async getByIds(
    classId: string,
    taskId: string,
    listId: string,
  ): Promise<IClassTaskListWithRelations | null> {
    return await prisma.classTaskList.findUnique({
      where: {
        classId_taskId_listId: { classId, taskId, listId },
      },
      include: {
        classTask: {
          include: {
            task: {
              include: {
                taskParams: true,
                taskTests: true,
              },
            },
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
      prisma.classTaskList.findMany({
        where: { listId },
        include: {
          classTask: {
            include: {
              task: {
                include: {
                  taskParams: true,
                  taskTests: true,
                },
              },
            },
          },
          list: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.classTaskList.count({ where: { listId } }),
    ]);

    return { classTaskLists, total };
  }

  async delete(classId: string, taskId: string, listId: string): Promise<void> {
    try {
      await prisma.classTaskList.delete({
        where: {
          classId_taskId_listId: { classId, taskId, listId },
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
}
