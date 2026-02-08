import { Injectable } from '@nestjs/common';
import { prisma } from '../database/prismaClient';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ApplicationError } from '../entities/errors/ApplicationError';
import { ICreateListDTO, IGetListsQuery, IUpdateListDTO } from '../dtos/List';
import { List } from '@prisma/client';

export interface IListWithRelations extends List {
  class?: {
    classId: string;
    name: string;
    code: number;
    professorId: string;
  };
  _count?: {
    classTaskLists: number;
  };
}

export abstract class ListRepository {
  abstract create(data: ICreateListDTO): Promise<List>;
  abstract getById(listId: string): Promise<IListWithRelations | null>;
  abstract getByClassId(
    classId: string,
    query: IGetListsQuery,
  ): Promise<{ lists: IListWithRelations[]; total: number }>;
  abstract update(listId: string, data: IUpdateListDTO): Promise<List>;
  abstract delete(listId: string): Promise<void>;
}

@Injectable()
export class PrismaListRepository implements ListRepository {
  async create(data: ICreateListDTO): Promise<List> {
    try {
      return await prisma.list.create({
        data: {
          classId: data.classId,
          title: data.title,
          deadline: new Date(data.deadline),
          submissionLimit: data.submissionLimit,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new ApplicationError(400, 'Erro ao criar lista', error);
      }
      throw error;
    }
  }

  async getById(listId: string): Promise<IListWithRelations | null> {
    return await prisma.list.findUnique({
      where: { listId },
      include: {
        class: {
          select: {
            classId: true,
            name: true,
            code: true,
            professorId: true,
          },
        },
        _count: {
          select: {
            classTaskLists: true,
          },
        },
      },
    });
  }

  async getByClassId(
    classId: string,
    query: IGetListsQuery,
  ): Promise<{ lists: IListWithRelations[]; total: number }> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [lists, total] = await Promise.all([
      prisma.list.findMany({
        where: { classId },
        include: {
          class: {
            select: {
              classId: true,
              name: true,
              code: true,
              professorId: true,
            },
          },
          _count: {
            select: {
              classTaskLists: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { deadline: 'asc' },
      }),
      prisma.list.count({ where: { classId } }),
    ]);

    return { lists, total };
  }

  async update(listId: string, data: IUpdateListDTO): Promise<List> {
    try {
      const updateData: any = { ...data };
      if (data.deadline) {
        updateData.deadline = new Date(data.deadline);
      }
      return await prisma.list.update({
        where: { listId },
        data: updateData,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new ApplicationError(400, 'Erro ao atualizar lista', error);
      }
      throw error;
    }
  }

  async delete(listId: string): Promise<void> {
    try {
      await prisma.list.delete({
        where: { listId },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new ApplicationError(400, 'Erro ao excluir lista', error);
      }
      throw error;
    }
  }
}
