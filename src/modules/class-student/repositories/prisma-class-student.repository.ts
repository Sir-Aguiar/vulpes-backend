import { Injectable } from '@nestjs/common';
import { ClassStudent, Prisma } from '@prisma/client';
import { ApplicationError } from '../../../common/errors/application.error';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CreateClassStudentDto } from '../dto/create-class-student.dto';
import { GetClassStudentsQueryDto } from '../dto/get-class-students.dto';
import {
  ClassStudentRepository,
  ClassStudentWithRelations,
} from './class-student.repository';

const STUDENT_SELECT = {
  userId: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class PrismaClassStudentRepository implements ClassStudentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClassStudentDto): Promise<ClassStudent> {
    try {
      return await this.prisma.classStudent.create({
        data: { classId: data.classId, studentId: data.studentId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
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

  getByIds(
    classId: string,
    studentId: string,
  ): Promise<ClassStudentWithRelations | null> {
    return this.prisma.classStudent.findUnique({
      where: { classId_studentId: { classId, studentId } },
      include: {
        student: { select: STUDENT_SELECT },
        class: { select: { classId: true, name: true, code: true } },
      },
    });
  }

  async getByClassId(
    classId: string,
    query: GetClassStudentsQueryDto,
  ): Promise<{ students: ClassStudentWithRelations[]; total: number }> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [students, total] = await this.prisma.$transaction([
      this.prisma.classStudent.findMany({
        where: { classId },
        include: { student: { select: STUDENT_SELECT } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.classStudent.count({ where: { classId } }),
    ]);

    return { students, total };
  }

  async delete(classId: string, studentId: string): Promise<void> {
    try {
      await this.prisma.classStudent.delete({
        where: { classId_studentId: { classId, studentId } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
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
    const link = await this.prisma.classStudent.findUnique({
      where: { classId_studentId: { classId, studentId } },
    });
    return Boolean(link);
  }
}
