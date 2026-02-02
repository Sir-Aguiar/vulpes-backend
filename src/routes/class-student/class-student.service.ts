import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ClassStudentRepository } from '../../repositories/class-student-repository';
import { ClassRepository } from '../../repositories/class-repository';
import {
  ICreateClassStudentDTO,
  IGetClassStudentsQuery,
} from '../../dtos/ClassStudent';

@Injectable()
export class ClassStudentService {
  constructor(
    private readonly classStudentRepository: ClassStudentRepository,
    private readonly classRepository: ClassRepository,
  ) {}

  async create(data: ICreateClassStudentDTO, userId: string, userRole: string) {
    const classData = await this.classRepository.getById(data.classId);
    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (classData.professorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para adicionar estudantes a esta turma',
      );
    }

    return await this.classStudentRepository.create(data);
  }

  async getByClassId(
    classId: string,
    query: IGetClassStudentsQuery,
    userId: string,
    userRole: string,
  ) {
    const classData = await this.classRepository.getById(classId);
    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }

    const isStudentInClass = await this.classStudentRepository.isStudentInClass(
      classId,
      userId,
    );
    if (
      classData.professorId !== userId &&
      userRole !== 'ADMIN' &&
      !isStudentInClass
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para ver os estudantes desta turma',
      );
    }

    return await this.classStudentRepository.getByClassId(classId, query);
  }

  async delete(
    classId: string,
    studentId: string,
    userId: string,
    userRole: string,
  ) {
    const classData = await this.classRepository.getById(classId);
    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }

    const isProfessor = classData.professorId === userId;
    const isAdmin = userRole === 'ADMIN';
    const isSelf = studentId === userId;

    if (!isProfessor && !isAdmin && !isSelf) {
      throw new ForbiddenException(
        'Você não tem permissão para remover este estudante da turma',
      );
    }

    await this.classStudentRepository.delete(classId, studentId);
    return { message: 'Estudante removido da turma com sucesso' };
  }

  async isStudentInClass(classId: string, studentId: string): Promise<boolean> {
    return await this.classStudentRepository.isStudentInClass(
      classId,
      studentId,
    );
  }
}
