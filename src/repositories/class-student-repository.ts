import { Injectable } from '@nestjs/common';
import { prisma } from '../database/prismaClient';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ApplicationError } from '../entities/errors/ApplicationError';
import {
  ICreateClassStudentDTO,
  IGetClassStudentsQuery,
} from '../dtos/ClassStudent';
import { ClassStudent } from '@prisma/client';

export interface IClassStudentWithRelations extends ClassStudent {
  student?: {
    userId: string;
    name: string;
    email: string;
  };
  class?: {
    classId: string;
    name: string;
    code: number;
  };
}

export abstract class ClassStudentRepository {
  abstract create(data: ICreateClassStudentDTO): Promise<ClassStudent>;
  abstract getByIds(
    classId: string,
    studentId: string,
  ): Promise<IClassStudentWithRelations | null>;
  abstract getByClassId(
    classId: string,
    query: IGetClassStudentsQuery,
  ): Promise<{ students: IClassStudentWithRelations[]; total: number }>;
  abstract delete(classId: string, studentId: string): Promise<void>;
  abstract isStudentInClass(
    classId: string,
    studentId: string,
  ): Promise<boolean>;
}

@Injectable()
export class PrismaClassStudentRepository implements ClassStudentRepository {
  async create(data: ICreateClassStudentDTO): Promise<ClassStudent> {
    try {
      return await prisma.classStudent.create({
        data: {
          classId: data.classId,
          studentId: data.studentId,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ApplicationError(409, 'Estudante já está na turma', error);
        }
        throw new ApplicationError(
          400,
          'Erro ao adicionar estudante à turma',
          error,
        );
      }
      throw error;
    }
  }

  async getByIds(
    classId: string,
    studentId: string,
  ): Promise<IClassStudentWithRelations | null> {
    return await prisma.classStudent.findUnique({
      where: {
        classId_studentId: { classId, studentId },
      },
      include: {
        student: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
        class: {
          select: {
            classId: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async getByClassId(
    classId: string,
    query: IGetClassStudentsQuery,
  ): Promise<{ students: IClassStudentWithRelations[]; total: number }> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      prisma.classStudent.findMany({
        where: { classId },
        include: {
          student: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.classStudent.count({ where: { classId } }),
    ]);

    return { students, total };
  }

  async delete(classId: string, studentId: string): Promise<void> {
    try {
      await prisma.classStudent.delete({
        where: {
          classId_studentId: { classId, studentId },
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ApplicationError(
            404,
            'Estudante não encontrado na turma',
            error,
          );
        }
        throw new ApplicationError(
          400,
          'Erro ao remover estudante da turma',
          error,
        );
      }
      throw error;
    }
  }

  async isStudentInClass(classId: string, studentId: string): Promise<boolean> {
    const classStudent = await prisma.classStudent.findUnique({
      where: {
        classId_studentId: { classId, studentId },
      },
    });
    return !!classStudent;
  }
}
