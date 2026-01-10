import { Injectable } from '@nestjs/common';
import { prisma } from '../database/prismaClient';
import { ICreateTaskDTO } from '../dtos/Task';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ApplicationError } from '../entities/errors/ApplicationError';
import { ITask } from '../entities/Task';

export abstract class TaskRepository {
  abstract create(data: ICreateTaskDTO): Promise<any>;
  abstract getById(taskId: string): Promise<ITask | null>;
}

@Injectable()
export class PrismaTaskRepository implements TaskRepository {
  async create({
    taskParams,
    testCases,
    ...data
  }: ICreateTaskDTO): Promise<any> {
    try {
      return prisma.task.create({
        data: {
          ...data,
          inputMode: data.inputMode as any,
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
        throw new ApplicationError(500, 'Erro ao criar tarefa', error);
      }
    }
  }

  async getById(taskId: string): Promise<ITask | null> {
    return prisma.task.findUnique({
      where: { taskId },
      include: {
        taskParams: true,
        taskTests: true,
      },
    });
  }
}
