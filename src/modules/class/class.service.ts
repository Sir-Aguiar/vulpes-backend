import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  ensureClassWriteAccess,
  isAdmin,
  isProfessor,
} from '../../common/authorization/authorization.helpers';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateClassDto } from './dto/create-class.dto';
import { GetClassesQueryDto } from './dto/get-classes.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassRepository } from './repositories/class.repository';

@Injectable()
export class ClassService {
  constructor(private readonly classRepository: ClassRepository) {}

  async create(data: CreateClassDto, professor: AuthUser) {
    const code = await this.classRepository.generateUniqueCode();
    return this.classRepository.create({
      ...data,
      professorId: professor.userId,
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

  getAll(query: GetClassesQueryDto) {
    return this.classRepository.getAll(query);
  }

  /**
   * Retorna as turmas "relevantes" para o usuário autenticado.
   *
   * - Professor/Admin: turmas que leciona (via `professorId`). Usa paginação
   *   fixa de 100 porque a UI atual mostra tudo numa tela só.
   * - Estudante: turmas em que está matriculado (via `ClassStudent`).
   *
   * O shape de retorno `{ classes, total }` é mantido igual para ambas as
   * variantes para o front tratar uniformemente.
   */
  async getMyClasses(user: AuthUser) {
    if (isProfessor(user) || isAdmin(user)) {
      return this.classRepository.getAll({
        page: 1,
        limit: 100,
        professorId: user.userId,
      });
    }

    const classes = await this.classRepository.getClassesByStudentId(
      user.userId,
    );
    return { classes, total: classes.length };
  }

  async update(classId: string, data: UpdateClassDto, user: AuthUser) {
    const classData = await this.getById(classId);
    ensureClassWriteAccess(
      user,
      classData.professorId,
      'Você não tem permissão para atualizar esta turma',
    );
    return this.classRepository.update(classId, data);
  }

  async delete(classId: string, user: AuthUser) {
    const classData = await this.getById(classId);
    ensureClassWriteAccess(
      user,
      classData.professorId,
      'Você não tem permissão para excluir esta turma',
    );
    await this.classRepository.delete(classId);
    return { message: 'Turma excluída com sucesso' };
  }

  /**
   * Exposto para outros services (class-task, list, class-student) checarem
   * permissão de escrita em uma turma sem duplicar a busca do registro.
   * Retorna a turma já carregada para que o chamador possa reutilizá-la.
   */
  async assertClassWriteAccess(
    classId: string,
    user: AuthUser,
    message?: string,
  ) {
    const classData = await this.getById(classId);
    ensureClassWriteAccess(user, classData.professorId, message);
    return classData;
  }

  isOwnerOrAdmin(user: Pick<AuthUser, 'userId' | 'role'>, professorId: string) {
    return user.userId === professorId || user.role === Role.ADMIN;
  }
}
