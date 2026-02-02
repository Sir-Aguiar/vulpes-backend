import { Injectable } from '@nestjs/common';
import { prisma } from '../database/prismaClient';
import { ICreateTaskDTO, IGetTasksQuery, IUpdateTaskDTO } from '../dtos/Task';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ApplicationError } from '../entities/errors/ApplicationError';
import { ITask } from '../entities/Task';

export abstract class TaskRepository {
  abstract create(data: ICreateTaskDTO): Promise<any>;
  abstract getById(taskId: string): Promise<ITask | null>;
  abstract getAll(
    query: IGetTasksQuery,
  ): Promise<{ tasks: ITask[]; total: number }>;
  abstract update(taskId: string, data: IUpdateTaskDTO): Promise<ITask>;
  abstract delete(taskId: string, soft?: boolean): Promise<void>;
  abstract getByCreatorId(creatorId: string): Promise<ITask[]>;
  abstract getSubmissionCount(taskId: string): Promise<number>;
}

@Injectable()
export class PrismaTaskRepository implements TaskRepository {
  async create({
    taskParams,
    testCases,
    ...data
  }: ICreateTaskDTO & { creatorId: string }): Promise<any> {
    try {
      return prisma.task.create({
        data: {
          ...data,
          taskParams: {
            create: taskParams,
          },
          taskTests: {
            create: testCases.map((testCase) => ({
              ...testCase,
              input: [JSON.stringify(testCase.input)],
            })),
          },
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new ApplicationError(400, 'Erro ao criar tarefa', error);
      }
    }
  }

  async getById(taskId: string): Promise<ITask | null> {
    return prisma.task.findUnique({
      where: { taskId, deletedAt: null },
      include: {
        taskParams: true,
        taskTests: true,
      },
    });
  }

  async getAll(
    query: IGetTasksQuery,
  ): Promise<{ tasks: ITask[]; total: number }> {
    const { page, limit, creatorId, isPublic, isVisible, search } = query;
    const skip = (page - 1) * limit;

    let where: any = {
      deletedAt: null,
    };

    if (creatorId) {
      where.creatorId = creatorId;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic === 'true';
    }

    if (isVisible !== undefined) {
      where.isVisible = isVisible === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (query.custom) {
      where = { ...where, ...JSON.parse(query.custom) };
    }
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          taskParams: true,
          taskTests: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.count({ where }),
    ]);

    return { tasks, total };
  }

  async update(taskId: string, data: IUpdateTaskDTO): Promise<ITask> {
    const { taskParams, taskTests, ...taskData } = data;

    return await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { taskId },
        data: taskData,
      });

      if (taskParams) {
        await tx.taskParam.deleteMany({
          where: { taskId },
        });

        await tx.taskParam.createMany({
          data: taskParams.map((param) => ({
            taskId,
            name: param.name,
            type: param.type,
            isArray: param.isArray,
          })),
        });
      }

      if (taskTests) {
        await tx.taskTest.deleteMany({
          where: { taskId },
        });

        await tx.taskTest.createMany({
          data: taskTests.map((test) => ({
            taskId,
            input: [JSON.stringify(test.input)],
            expectedOutput: test.expectedOutput,
            expectedOutputType: test.expectedOutputType,
          })),
        });
      }

      return tx.task.findUnique({
        where: { taskId },
        include: {
          taskParams: true,
          taskTests: true,
        },
      }) as Promise<ITask>;
    });
  }

  async delete(taskId: string, soft: boolean = false): Promise<void> {
    if (soft) {
      await prisma.task.update({
        where: { taskId },
        data: { deletedAt: new Date() },
      });
    } else {
      await prisma.task.delete({
        where: { taskId },
      });
    }
  }

  async getByCreatorId(creatorId: string): Promise<ITask[]> {
    return prisma.task.findMany({
      where: { creatorId, deletedAt: null },
      include: {
        taskParams: true,
        taskTests: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSubmissionCount(taskId: string): Promise<number> {
    return await prisma.submission.count({
      where: { taskId },
    });
  }
}
