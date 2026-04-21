import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationError } from '../../../common/errors/application.error';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { GetTasksQueryDto } from '../dto/get-tasks.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskWithRelations } from '../entities/task.entity';
import { CreateTaskData, TaskRepository } from './task.repository';

const TASK_INCLUDE = {
  taskParams: true,
  taskTests: true,
} satisfies Prisma.TaskInclude;

@Injectable()
export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTaskData): Promise<TaskWithRelations> {
    const { taskParams, testCases, classIds: _classIds, ...rest } = data;
    void _classIds;

    try {
      return await this.prisma.task.create({
        data: {
          ...rest,
          taskParams: { create: taskParams },
          taskTests: {
            create: testCases.map((test) => ({
              ...test,
              input: [JSON.stringify(test.input)],
            })),
          },
        },
        include: TASK_INCLUDE,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(400, 'Erro ao criar tarefa', error);
      }
      throw error;
    }
  }

  getById(taskId: string): Promise<TaskWithRelations | null> {
    return this.prisma.task.findUnique({
      where: { taskId, deletedAt: null },
      include: TASK_INCLUDE,
    });
  }

  getByIds(taskIds: string[]): Promise<TaskWithRelations[]> {
    return this.prisma.task.findMany({
      where: { taskId: { in: taskIds }, deletedAt: null },
      include: TASK_INCLUDE,
    });
  }

  async getAll(
    query: GetTasksQueryDto,
  ): Promise<{ tasks: TaskWithRelations[]; total: number }> {
    const {
      page,
      limit,
      creatorId,
      isPublic,
      isVisible,
      includePublicVisible,
      search,
    } = query;
    const skip = (page - 1) * limit;
    const filters: Prisma.TaskWhereInput[] = [{ deletedAt: null }];

    if (search) {
      filters.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (creatorId && includePublicVisible) {
      filters.push({
        OR: [{ isPublic: true, isVisible: true }, { creatorId }],
      });
    } else {
      if (creatorId) filters.push({ creatorId });
      if (isPublic !== undefined) filters.push({ isPublic });
      if (isVisible !== undefined) filters.push({ isVisible });
    }

    const where: Prisma.TaskWhereInput = { AND: filters };

    const [tasks, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        include: TASK_INCLUDE,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.count({ where }),
    ]);

    return { tasks, total };
  }

  update(taskId: string, data: UpdateTaskDto): Promise<TaskWithRelations> {
    const { taskParams, taskTests, classIds: _classIds, ...taskData } = data;
    void _classIds;

    return this.prisma.$transaction(async (tx) => {
      await tx.task.update({ where: { taskId }, data: taskData });

      if (taskParams) {
        await tx.taskParam.deleteMany({ where: { taskId } });
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
        await tx.taskTest.deleteMany({ where: { taskId } });
        await tx.taskTest.createMany({
          data: taskTests.map((test) => ({
            taskId,
            input: [JSON.stringify(test.input)],
            expectedOutput: test.expectedOutput,
            expectedOutputType: test.expectedOutputType,
          })),
        });
      }

      return tx.task.findUniqueOrThrow({
        where: { taskId },
        include: TASK_INCLUDE,
      });
    });
  }

  async delete(taskId: string, soft: boolean = false): Promise<void> {
    if (soft) {
      await this.prisma.task.update({
        where: { taskId },
        data: { deletedAt: new Date() },
      });
      return;
    }
    await this.prisma.task.delete({ where: { taskId } });
  }

  getByCreatorId(creatorId: string): Promise<TaskWithRelations[]> {
    return this.prisma.task.findMany({
      where: { creatorId, deletedAt: null },
      include: TASK_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  getSubmissionCount(taskId: string): Promise<number> {
    return this.prisma.submission.count({ where: { taskId } });
  }

  /**
   * Tarefas que podem ser associadas a uma turma:
   * - Públicas e visíveis OU criadas pelo usuário
   * - Que não estejam ainda vinculadas à turma
   */
  getTasksLinkableToClass(
    classId: string,
    creatorId: string,
  ): Promise<TaskWithRelations[]> {
    return this.prisma.task.findMany({
      where: {
        deletedAt: null,
        AND: [
          { OR: [{ isPublic: true, isVisible: true }, { creatorId }] },
          { NOT: { classTasks: { some: { classId } } } },
        ],
      },
      include: TASK_INCLUDE,
    });
  }
}
