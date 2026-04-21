import { Injectable } from '@nestjs/common';
import { Prisma, StudentClassPermissionRequest } from '@prisma/client';
import { ApplicationError } from '../../../common/errors/application.error';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { GetStudentClassPermissionRequestsQueryDto } from '../dto/get-student-class-permission-requests.dto';
import {
  CreateStudentClassPermissionRequestData,
  StudentClassPermissionRequestRepository,
  StudentClassPermissionRequestWithRelations,
} from './student-class-permission-request.repository';

const STUDENT_SELECT = {
  student: { select: { userId: true, name: true, email: true } },
} satisfies Prisma.StudentClassPermissionRequestInclude;

const CLASS_SELECT = {
  class: {
    select: {
      classId: true,
      name: true,
      code: true,
      professor: { select: { userId: true, name: true } },
    },
  },
} satisfies Prisma.StudentClassPermissionRequestInclude;

@Injectable()
export class PrismaStudentClassPermissionRequestRepository implements StudentClassPermissionRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateStudentClassPermissionRequestData,
  ): Promise<StudentClassPermissionRequest> {
    try {
      return await this.prisma.studentClassPermissionRequest.create({
        data: {
          classId: data.classId,
          studentId: data.studentId,
          message: data.message,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
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

  getByIds(
    classId: string,
    studentId: string,
  ): Promise<StudentClassPermissionRequestWithRelations | null> {
    return this.prisma.studentClassPermissionRequest.findUnique({
      where: { classId_studentId: { classId, studentId } },
      include: { ...STUDENT_SELECT, ...CLASS_SELECT },
    });
  }

  async getByClassId(
    classId: string,
    query: GetStudentClassPermissionRequestsQueryDto,
  ): Promise<{
    requests: StudentClassPermissionRequestWithRelations[];
    total: number;
  }> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [requests, total] = await this.prisma.$transaction([
      this.prisma.studentClassPermissionRequest.findMany({
        where: { classId },
        include: STUDENT_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.studentClassPermissionRequest.count({ where: { classId } }),
    ]);

    return { requests, total };
  }

  getByStudentId(
    studentId: string,
  ): Promise<StudentClassPermissionRequestWithRelations[]> {
    return this.prisma.studentClassPermissionRequest.findMany({
      where: { studentId },
      include: CLASS_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(classId: string, studentId: string): Promise<void> {
    try {
      await this.prisma.studentClassPermissionRequest.delete({
        where: { classId_studentId: { classId, studentId } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ApplicationError(404, 'Solicitação não encontrada', error);
        }
        throw new ApplicationError(400, 'Erro ao excluir solicitação', error);
      }
      throw error;
    }
  }
}
