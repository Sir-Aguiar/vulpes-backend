import { Injectable } from '@nestjs/common';
import { Class, Prisma } from '@prisma/client';
import { ApplicationError } from '../../../common/errors/application.error';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { GetClassesQueryDto } from '../dto/get-classes.dto';
import { UpdateClassDto } from '../dto/update-class.dto';
import {
  ClassRepository,
  ClassWithRelations,
  CreateClassData,
} from './class.repository';

const CLASS_INCLUDE = {
  professor: {
    select: { userId: true, name: true, email: true },
  },
  _count: {
    select: { classStudents: true, classTasks: true, lists: true },
  },
} satisfies Prisma.ClassInclude;

const CODE_MIN = 1000;
const CODE_RANGE = 9000;
const DEFAULT_CODE_ATTEMPTS = 10;

@Injectable()
export class PrismaClassRepository implements ClassRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClassData): Promise<Class> {
    try {
      return await this.prisma.class.create({
        data: {
          code: data.code,
          name: data.name,
          professorId: data.professorId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ApplicationError(409, 'Código da turma já existe', error);
        }
        if (error.code === 'P2025') {
          throw new ApplicationError(404, 'Professor não encontrado', error);
        }
        throw new ApplicationError(400, 'Erro ao criar turma', error);
      }
      throw error;
    }
  }

  getById(classId: string): Promise<ClassWithRelations | null> {
    return this.prisma.class.findUnique({
      where: { classId },
      include: CLASS_INCLUDE,
    });
  }

  getByIds(classIds: string[]): Promise<ClassWithRelations[]> {
    return this.prisma.class.findMany({
      where: { classId: { in: classIds } },
    });
  }

  getByCode(code: number): Promise<ClassWithRelations | null> {
    return this.prisma.class.findUnique({
      where: { code },
      include: CLASS_INCLUDE,
    });
  }

  async getAll(
    query: GetClassesQueryDto,
  ): Promise<{ classes: ClassWithRelations[]; total: number }> {
    const { page, limit, professorId, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ClassWhereInput = {};
    if (professorId) where.professorId = professorId;
    if (search) {
      where.OR = [{ name: { contains: search, mode: 'insensitive' } }];
    }

    const [classes, total] = await this.prisma.$transaction([
      this.prisma.class.findMany({
        where,
        include: CLASS_INCLUDE,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.class.count({ where }),
    ]);

    return { classes, total };
  }

  async update(classId: string, data: UpdateClassDto): Promise<Class> {
    try {
      return await this.prisma.class.update({
        where: { classId },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(400, 'Erro ao atualizar turma', error);
      }
      throw error;
    }
  }

  async delete(classId: string): Promise<void> {
    try {
      await this.prisma.class.delete({ where: { classId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(400, 'Erro ao excluir turma', error);
      }
      throw error;
    }
  }

  async generateUniqueCode(
    maxAttempts: number = DEFAULT_CODE_ATTEMPTS,
  ): Promise<number> {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const code = Math.floor(CODE_MIN + Math.random() * CODE_RANGE);
      const existing = await this.prisma.class.findUnique({
        where: { code },
        select: { code: true },
      });
      if (!existing) return code;
    }
    throw new ApplicationError(
      500,
      'Não foi possível gerar um código único após múltiplas tentativas',
    );
  }

  async getClassesByStudentId(
    studentId: string,
  ): Promise<ClassWithRelations[]> {
    const classStudents = await this.prisma.classStudent.findMany({
      where: { studentId },
      include: { class: { include: CLASS_INCLUDE } },
    });
    return classStudents.map((cs) => cs.class);
  }
}
