import { Injectable } from '@nestjs/common';
import { prisma } from '../database/prismaClient';
import { ICreateTaskDTO } from '../dtos/Task';
import { Task } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ApplicationError } from '../entities/errors/ApplicationError';

export abstract class TaskRepository {
  abstract create(data: ICreateTaskDTO): Promise<any>;
  abstract getById(taskId: string): Promise<Task | null>;
}

@Injectable()
export class PrismaTaskRepository implements TaskRepository {
  async create({ params, testCases, ...data }: ICreateTaskDTO): Promise<any> {
    try {
      return prisma.task.create({
        data: {
          ...data,
          inputMode: data.inputMode as any,
          taskParams: {
            create: params,
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

  async getById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({
      where: { id },
      include: {
        taskParams: true,
        taskTests: true,
      },
    });
  }
}
