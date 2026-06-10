import { Injectable } from '@nestjs/common';
import { Prisma, TaskList } from '@prisma/client';
import { ApplicationError } from '../../../common/errors/application.error';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CreateClassTaskListDto } from '../dto/create-class-task-list.dto';
import { GetClassTaskListsQueryDto } from '../dto/get-class-task-lists.dto';
import {
  ClassTaskListRepository,
  ClassTaskListWithRelations,
  TaskListWeightInput,
} from './class-task-list.repository';

const TASK_INCLUDE = {
  task: { include: { taskParams: true, taskTests: true } },
  list: true,
} satisfies Prisma.TaskListInclude;

@Injectable()
export class PrismaClassTaskListRepository implements ClassTaskListRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClassTaskListDto): Promise<TaskList> {
    try {
      return await this.prisma.taskList.create({
        data: {
          taskId: data.taskId,
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
    tasks: TaskListWeightInput[],
  ): Promise<{ count: number }> {
    try {
      const result = await this.prisma.taskList.createMany({
        data: tasks.map(({ taskId, weight }) => ({ taskId, listId, weight })),
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
    taskId: string,
    listId: string,
  ): Promise<ClassTaskListWithRelations | null> {
    return this.prisma.taskList.findUnique({
      where: { taskId_listId: { taskId, listId } },
      include: TASK_INCLUDE,
    });
  }

  async getByListId(
    listId: string,
    query: GetClassTaskListsQueryDto,
  ): Promise<{ classTaskLists: ClassTaskListWithRelations[]; total: number }> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [classTaskLists, total] = await this.prisma.$transaction([
      this.prisma.taskList.findMany({
        where: { listId },
        include: TASK_INCLUDE,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.taskList.count({ where: { listId } }),
    ]);

    return { classTaskLists, total };
  }

  async delete(taskId: string, listId: string): Promise<void> {
    try {
      await this.prisma.taskList.delete({
        where: { taskId_listId: { taskId, listId } },
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
    taskIds: string[],
  ): Promise<{ count: number }> {
    try {
      const result = await this.prisma.taskList.deleteMany({
        where: { listId, taskId: { in: taskIds } },
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
