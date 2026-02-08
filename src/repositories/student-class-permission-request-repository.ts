import { Injectable } from '@nestjs/common';
import { prisma } from '../database/prismaClient';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ApplicationError } from '../entities/errors/ApplicationError';
import {
  ICreateStudentClassPermissionRequestDTO,
  IGetStudentClassPermissionRequestsQuery,
} from '../dtos/StudentClassPermissionRequest';
import { StudentClassPermissionRequest } from '@prisma/client';

export interface IStudentClassPermissionRequestWithRelations extends StudentClassPermissionRequest {
  student?: {
    userId: string;
    name: string;
    email: string;
  };
  class?: {
    classId: string;
    name: string;
    code: number;
    professor: {
      userId: string;
      name: string;
    };
  };
}

export abstract class StudentClassPermissionRequestRepository {
  abstract create(
    data: ICreateStudentClassPermissionRequestDTO & { studentId: string },
  ): Promise<StudentClassPermissionRequest>;
  abstract getByIds(
    classId: string,
    studentId: string,
  ): Promise<IStudentClassPermissionRequestWithRelations | null>;
  abstract getByClassId(
    classId: string,
    query: IGetStudentClassPermissionRequestsQuery,
  ): Promise<{
    requests: IStudentClassPermissionRequestWithRelations[];
    total: number;
  }>;
  abstract getByStudentId(
    studentId: string,
  ): Promise<IStudentClassPermissionRequestWithRelations[]>;
  abstract delete(classId: string, studentId: string): Promise<void>;
}

@Injectable()
export class PrismaStudentClassPermissionRequestRepository implements StudentClassPermissionRequestRepository {
  async create(
    data: ICreateStudentClassPermissionRequestDTO & { studentId: string },
  ): Promise<StudentClassPermissionRequest> {
    try {
      return await prisma.studentClassPermissionRequest.create({
        data: {
          classId: data.classId,
          studentId: data.studentId,
          message: data.message,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ApplicationError(
            409,
            'Solicitação já enviada para esta turma',
            error,
          );
        }
        throw new ApplicationError(400, 'Erro ao criar solicitação', error);
      }
      throw error;
    }
  }

  async getByIds(
    classId: string,
    studentId: string,
  ): Promise<IStudentClassPermissionRequestWithRelations | null> {
    return await prisma.studentClassPermissionRequest.findUnique({
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
            professor: true,
          },
        },
      },
    });
  }

  async getByClassId(
    classId: string,
    query: IGetStudentClassPermissionRequestsQuery,
  ): Promise<{
    requests: IStudentClassPermissionRequestWithRelations[];
    total: number;
  }> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      prisma.studentClassPermissionRequest.findMany({
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
      prisma.studentClassPermissionRequest.count({ where: { classId } }),
    ]);

    return { requests, total };
  }

  async getByStudentId(
    studentId: string,
  ): Promise<IStudentClassPermissionRequestWithRelations[]> {
    return await prisma.studentClassPermissionRequest.findMany({
      where: { studentId },
      include: {
        class: {
          select: {
            classId: true,
            name: true,
            code: true,
            professor: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(classId: string, studentId: string): Promise<void> {
    try {
      await prisma.studentClassPermissionRequest.delete({
        where: {
          classId_studentId: { classId, studentId },
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ApplicationError(404, 'Solicitação não encontrada', error);
        }
        throw new ApplicationError(400, 'Erro ao excluir solicitação', error);
      }
      throw error;
    }
  }
}
