import { Injectable } from '@nestjs/common';
import { ClassTaskList, Prisma } from '@prisma/client';
import { ApplicationError } from '../../../common/errors/application.error';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CreateClassTaskListDto } from '../dto/create-class-task-list.dto';
import { GetClassTaskListsQueryDto } from '../dto/get-class-task-lists.dto';
import {
  ClassTaskListRepository,
  ClassTaskListWeightInput,
  ClassTaskListWithRelations,
} from './class-task-list.repository';

const CLASS_TASK_LIST_INCLUDE = {
  classTask: {
    include: {
      task: { include: { taskParams: true, taskTests: true } },
    },
  },
  list: true,
} satisfies Prisma.ClassTaskListInclude;

@Injectable()
export class PrismaClassTaskListRepository implements ClassTaskListRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClassTaskListDto): Promise<ClassTaskList> {
    try {
      return await this.prisma.classTaskList.create({
        data: {
          classTaskId: data.classTaskId,
          listId: data.listId,
          weight: data.weight,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
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
    tasks: ClassTaskListWeightInput[],
  ): Promise<{ count: number }> {
    try {
      const result = await this.prisma.classTaskList.createMany({
        data: tasks.map(({ classTaskId, weight }) => ({
          classTaskId,
          listId,
          weight: weight ?? 1.0,
        })),
        skipDuplicates: true,
      });
      return { count: result.count };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao associar tarefas à lista',
          error,
        );
      }
      throw error;
    }
  }

  getByIds(
    classTaskId: string,
    listId: string,
  ): Promise<ClassTaskListWithRelations | null> {
    return this.prisma.classTaskList.findFirst({
      where: { classTaskId, listId },
      include: CLASS_TASK_LIST_INCLUDE,
    });
  }

  getById(classTaskListId: string): Promise<ClassTaskListWithRelations | null> {
    return this.prisma.classTaskList.findUnique({
      where: { classTaskListId },
      include: CLASS_TASK_LIST_INCLUDE,
    });
  }

  async getByListId(
    listId: string,
    query: GetClassTaskListsQueryDto,
  ): Promise<{ classTaskLists: ClassTaskListWithRelations[]; total: number }> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [classTaskLists, total] = await this.prisma.$transaction([
      this.prisma.classTaskList.findMany({
        where: { listId },
        include: CLASS_TASK_LIST_INCLUDE,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.classTaskList.count({ where: { listId } }),
    ]);

    return { classTaskLists, total };
  }

  async delete(classTaskListId: string): Promise<void> {
    try {
      await this.prisma.classTaskList.delete({
        where: { classTaskListId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
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
    classTaskIds: string[],
  ): Promise<{ count: number }> {
    try {
      const result = await this.prisma.classTaskList.deleteMany({
        where: { listId, classTaskId: { in: classTaskIds } },
      });
      return { count: result.count };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
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
