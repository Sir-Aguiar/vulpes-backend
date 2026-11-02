import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationError } from '../../../common/errors/application.error';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { changedFields } from '../../audit/audit-diff';
import { AuditAction } from '../../audit/audit.types';
import { AuditService } from '../../audit/audit.service';
import { LinkableTask } from '../dto/get-linkable-tasks.dto';
import {
  GetPublishedTasksQueryDto,
  PublishedTask,
} from '../dto/get-published-tasks.dto';
import { GetTasksQueryDto } from '../dto/get-tasks.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskWithRelations } from '../entities/task.entity';
import {
  CreateTaskData,
  LinkableTasksOptions,
  TaskAuditContext,
  TaskRepository,
} from './task.repository';

const LINKABLE_TASK_SELECT = {
  taskId: true,
  creatorId: true,
  title: true,
  description: true,
  updatedAt: true,
  createdAt: true,
  isPublic: true,
  isVisible: true,
} satisfies Prisma.TaskSelect;

const PUBLISHED_TASK_SELECT = {
  taskId: true,
  creatorId: true,
  title: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  isPublic: true,
  isVisible: true,
  creator: { select: { userId: true, name: true } },
} satisfies Prisma.TaskSelect;

const TASK_INCLUDE = {
  taskParams: true,
  taskTests: true,
} satisfies Prisma.TaskInclude;

@Injectable()
export class PrismaTaskRepository implements TaskRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

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

  update(
    taskId: string,
    data: UpdateTaskDto,
    audit?: TaskAuditContext,
  ): Promise<TaskWithRelations> {
    const { taskParams, taskTests, classIds: _classIds, ...taskData } = data;
    void _classIds;

    return this.prisma.$transaction(async (tx) => {
      await tx.task.update({ where: { taskId }, data: taskData });

      if (audit) {
        const diff = changedFields(
          {
            isVisible: audit.before.isVisible,
            isPublic: audit.before.isPublic,
          },
          {
            isVisible: taskData.isVisible ?? audit.before.isVisible,
            isPublic: taskData.isPublic ?? audit.before.isPublic,
          },
        );
        if (diff) {
          await this.audit.record(
            {
              actor: audit.actor,
              action: AuditAction.taskVisibilityChanged,
              entityType: 'Task',
              entityId: taskId,
              diff,
            },
            tx,
          );
        }
      }

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

  async delete(
    taskId: string,
    soft: boolean = false,
    audit?: TaskAuditContext,
  ): Promise<void> {
    if (soft) {
      const deletedAt = new Date();
      await this.prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { taskId },
          data: { deletedAt },
        });
        if (!audit) return;
        const diff = changedFields(
          { deletedAt: audit.before.deletedAt },
          { deletedAt },
        );
        if (!diff) return;
        await this.audit.record(
          {
            actor: audit.actor,
            action: AuditAction.taskDeleted,
            entityType: 'Task',
            entityId: taskId,
            diff,
          },
          tx,
        );
      });
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      if (audit) {
        await this.audit.record(
          {
            actor: audit.actor,
            action: AuditAction.taskDeleted,
            entityType: 'Task',
            entityId: taskId,
            diff: {
              before: {
                isVisible: audit.before.isVisible,
                isPublic: audit.before.isPublic,
                deletedAt: audit.before.deletedAt?.toISOString() ?? null,
              },
              after: { removed: true },
            },
          },
          tx,
        );
      }
      await tx.task.delete({ where: { taskId } });
    });
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
   * - Públicas e visíveis OU criadas pelo usuário autenticado.
   * - Que ainda NÃO estejam vinculadas à turma informada.
   *
   * Suporta busca por título (case-insensitive, `contains`), ordenação
   * por `createdAt` e paginação. Retorna `{ tasks, total }` numa só
   * transação para garantir que o `total` corresponde aos filtros.
   */
  async getTasksLinkableToClass(
    classId: string,
    creatorId: string,
    options: LinkableTasksOptions,
  ): Promise<{ tasks: LinkableTask[]; total: number }> {
    const { page, limit, search, order } = options;
    const skip = (page - 1) * limit;

    const filters: Prisma.TaskWhereInput[] = [
      { deletedAt: null },
      { OR: [{ isPublic: true, isVisible: true }, { creatorId }] },
      { NOT: { classTasks: { some: { classId } } } },
    ];

    if (search) {
      filters.push({ title: { contains: search, mode: 'insensitive' } });
    }

    const where: Prisma.TaskWhereInput = { AND: filters };

    const [tasks, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        select: LINKABLE_TASK_SELECT,
        orderBy: { createdAt: order },
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return { tasks, total };
  }

  /**
   * Catálogo público para a homepage: tarefas publicadas e visíveis,
   * independentes de turma ou lista. Todos os perfis recebem o mesmo
   * conjunto; o acesso à tarefa é sempre via `taskId`.
   */
  async getPublishedTasks(
    query: GetPublishedTasksQueryDto,
  ): Promise<{ tasks: PublishedTask[]; total: number }> {
    const { page, limit, search, sortBy, order } = query;
    const skip = (page - 1) * limit;

    const filters: Prisma.TaskWhereInput[] = [
      { deletedAt: null },
      { isPublic: true },
      { isVisible: true },
    ];

    if (search) {
      filters.push({ title: { contains: search, mode: 'insensitive' } });
    }

    const where: Prisma.TaskWhereInput = { AND: filters };
    const orderBy: Prisma.TaskOrderByWithRelationInput = {
      [sortBy]: order,
    };

    const [tasks, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        select: PUBLISHED_TASK_SELECT,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return { tasks: tasks as PublishedTask[], total };
  }
}
