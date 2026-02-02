import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ClassRepository } from '../../repositories/class-repository';
import {
  ICreateClassDTO,
  IGetClassesQuery,
  IUpdateClassDTO,
} from '../../dtos/Class';
import { UserRepository } from '../../repositories/user-repository';

@Injectable()
export class ClassService {
  constructor(
    private readonly classRepository: ClassRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async create(data: ICreateClassDTO, professorId: string) {
    const user = await this.userRepository.findById(professorId);
    if (!user || (user.role !== 'PROFESSOR' && user.role !== 'ADMIN')) {
      throw new ForbiddenException(
        'Apenas professores ou administradores podem criar turmas',
      );
    }

    const code = await this.classRepository.generateUniqueCode();

    return await this.classRepository.create({
      ...data,
      professorId,
      code,
    });
  }

  async getById(classId: string) {
    const classData = await this.classRepository.getById(classId);
    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }
    return classData;
  }

  async getByCode(code: number) {
    const classData = await this.classRepository.getByCode(code);
    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }
    return classData;
  }

  async getAll(query: IGetClassesQuery) {
    return await this.classRepository.getAll(query);
  }

  async getMyClasses(userId: string, userRole: string) {
    if (userRole === 'PROFESSOR' || userRole === 'ADMIN') {
      return await this.classRepository.getAll({
        page: 1,
        limit: 100,
        professorId: userId,
      });
    }
    return {
      classes: await this.classRepository.getClassesByStudentId(userId),
      total: 0,
    };
  }

  async update(
    classId: string,
    data: IUpdateClassDTO,
    userId: string,
    userRole: string,
  ) {
    const classData = await this.classRepository.getById(classId);
    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }
    if (classData.professorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar esta turma',
      );
    }

    return await this.classRepository.update(classId, data);
  }

  async delete(classId: string, userId: string, userRole: string) {
    const classData = await this.classRepository.getById(classId);
    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }

    // Only professor of the class or admin can delete
    if (classData.professorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para excluir esta turma',
      );
    }

    await this.classRepository.delete(classId);
    return { message: 'Turma excluída com sucesso' };
  }
}
