import { Injectable } from '@nestjs/common';
import { prisma } from '../database/prismaClient';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ApplicationError } from '../entities/errors/ApplicationError';
import {
  ICreateClassDTO,
  IGetClassesQuery,
  IUpdateClassDTO,
} from '../dtos/Class';
import { Class } from '@prisma/client';

export interface IClassWithRelations extends Class {
  professor?: {
    userId: string;
    name: string;
    email: string;
  };
  _count?: {
    classStudents: number;
    classTasks: number;
    lists: number;
  };
}

export abstract class ClassRepository {
  abstract create(
    data: ICreateClassDTO & { professorId: string; code: number },
  ): Promise<Class>;
  abstract getById(classId: string): Promise<IClassWithRelations | null>;
  abstract getByCode(code: number): Promise<IClassWithRelations | null>;
  abstract getAll(
    query: IGetClassesQuery,
  ): Promise<{ classes: IClassWithRelations[]; total: number }>;
  abstract update(classId: string, data: IUpdateClassDTO): Promise<Class>;
  abstract delete(classId: string): Promise<void>;
  abstract generateUniqueCode(): Promise<number>;
  abstract getClassesByStudentId(
    studentId: string,
  ): Promise<IClassWithRelations[]>;
}

@Injectable()
export class PrismaClassRepository implements ClassRepository {
  async create(
    data: ICreateClassDTO & { professorId: string; code: number },
  ): Promise<Class> {
    try {
      return await prisma.class.create({
        data: {
          code: data.code,
          name: data.name,
          professorId: data.professorId,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ApplicationError(400, 'Código da turma já existe', error);
        }
        if (error.code === 'P2025') {
          throw new ApplicationError(404, 'Professor não encontrado', error);
        }
        throw new ApplicationError(400, 'Erro ao criar turma', error);
      }
      throw error;
    }
  }

  async getById(classId: string): Promise<IClassWithRelations | null> {
    return await prisma.class.findUnique({
      where: { classId },
      include: {
        professor: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            classStudents: true,
            classTasks: true,
            lists: true,
          },
        },
      },
    });
  }

  async getByCode(code: number): Promise<IClassWithRelations | null> {
    return await prisma.class.findUnique({
      where: { code },
      include: {
        professor: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            classStudents: true,
            classTasks: true,
            lists: true,
          },
        },
      },
    });
  }

  async getAll(
    query: IGetClassesQuery,
  ): Promise<{ classes: IClassWithRelations[]; total: number }> {
    const { page, limit, professorId, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (professorId) {
      where.professorId = professorId;
    }

    if (search) {
      where.OR = [{ name: { contains: search, mode: 'insensitive' } }];
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: {
          professor: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              classStudents: true,
              classTasks: true,
              lists: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.class.count({ where }),
    ]);

    return { classes, total };
  }

  async update(classId: string, data: IUpdateClassDTO): Promise<Class> {
    try {
      return await prisma.class.update({
        where: { classId },
        data,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new ApplicationError(400, 'Erro ao atualizar turma', error);
      }
      throw error;
    }
  }

  async delete(classId: string): Promise<void> {
    try {
      await prisma.class.delete({
        where: { classId },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new ApplicationError(400, 'Erro ao excluir turma', error);
      }
      throw error;
    }
  }

  async generateUniqueCode(): Promise<number> {
    let code: number;
    let exists = true;

    while (exists) {
      code = Math.floor(1000 + Math.random() * 8999);
      const existingClass = await prisma.class.findUnique({
        where: { code },
      });
      exists = !!existingClass;
    }

    return code!;
  }

  async getClassesByStudentId(
    studentId: string,
  ): Promise<IClassWithRelations[]> {
    const classStudents = await prisma.classStudent.findMany({
      where: { studentId },
      include: {
        class: {
          include: {
            professor: {
              select: {
                userId: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                classStudents: true,
                classTasks: true,
                lists: true,
              },
            },
          },
        },
      },
    });

    return classStudents.map((cs) => cs.class);
  }
}
