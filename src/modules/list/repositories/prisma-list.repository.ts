import { Injectable } from '@nestjs/common';
import { List, Prisma } from '@prisma/client';
import { ApplicationError } from '../../../common/errors/application.error';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { GetListsQueryDto } from '../dto/get-lists.dto';
import { UpdateListDto } from '../dto/update-list.dto';
import {
  CreateListData,
  ListRepository,
  ListWithRelations,
} from './list.repository';

const CLASS_SELECT = {
  classId: true,
  name: true,
  code: true,
  professorId: true,
} satisfies Prisma.ClassSelect;

@Injectable()
export class PrismaListRepository implements ListRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateListData): Promise<List> {
    try {
      return await this.prisma.list.create({
        data: {
          classId: data.classId,
          title: data.title,
          deadline: new Date(data.deadline),
          submissionLimit: data.submissionLimit,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(400, 'Erro ao criar lista', error);
      }
      throw error;
    }
  }

  getById(listId: string): Promise<ListWithRelations | null> {
    return this.prisma.list.findUnique({
      where: { listId },
      include: {
        class: { select: CLASS_SELECT },
        submissions: true,
        _count: { select: { taskLists: true } },
      },
    });
  }

  getByIdAndTaskId(
    listId: string,
    taskId: string,
  ): Promise<ListWithRelations | null> {
    return this.prisma.list.findUnique({
      where: { listId, submissions: { every: { taskId } } },
      include: {
        class: { select: CLASS_SELECT },
        submissions: true,
        _count: { select: { taskLists: true } },
      },
    });
  }

  async getByClassId(
    classId: string,
    query: GetListsQueryDto,
  ): Promise<{
    lists: Omit<ListWithRelations, 'submissions'>[];
    total: number;
  }> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [lists, total] = await this.prisma.$transaction([
      this.prisma.list.findMany({
        where: { classId },
        include: {
          class: { select: CLASS_SELECT },
          _count: { select: { taskLists: true } },
        },
        skip,
        take: limit,
        orderBy: { deadline: 'asc' },
      }),
      this.prisma.list.count({ where: { classId } }),
    ]);

    return { lists, total };
  }

  async update(listId: string, data: UpdateListDto): Promise<List> {
    try {
      const updateData: Prisma.ListUpdateInput = { ...data };
      if (data.deadline) updateData.deadline = new Date(data.deadline);

      return await this.prisma.list.update({
        where: { listId },
        data: updateData,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(400, 'Erro ao atualizar lista', error);
      }
      throw error;
    }
  }

  async delete(listId: string): Promise<void> {
    try {
      await this.prisma.list.delete({ where: { listId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(400, 'Erro ao excluir lista', error);
      }
      throw error;
    }
  }
}
