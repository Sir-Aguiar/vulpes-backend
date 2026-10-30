import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ensureClassWriteAccess,
  isAdmin,
  isClassOwner,
} from '../../common/authorization/authorization.helpers';
import { AuthUser } from '../../common/types/auth-user.type';
import {
  AuditAction,
  classStudentEntityId,
  membershipDiff,
} from '../audit/audit.types';
import { AuditService } from '../audit/audit.service';
import { ClassRepository } from '../class/repositories/class.repository';
import { CreateClassStudentDto } from './dto/create-class-student.dto';
import { GetClassStudentsQueryDto } from './dto/get-class-students.dto';
import { ClassStudentRepository } from './repositories/class-student.repository';

@Injectable()
export class ClassStudentService {
  constructor(
    private readonly classStudentRepository: ClassStudentRepository,
    private readonly classRepository: ClassRepository,
    private readonly audit: AuditService,
  ) {}

  /**
   * Matrícula "pelo professor": cria o vínculo `ClassStudent` diretamente.
   * Para fluxo iniciado pelo estudante, use `StudentClassPermissionRequest`.
   */
  async create(data: CreateClassStudentDto, user: AuthUser) {
    const classData = await this.classRepository.getById(data.classId);
    if (!classData) throw new NotFoundException('Turma não encontrada');

    ensureClassWriteAccess(
      user,
      classData.professorId,
      'Você não tem permissão para adicionar estudantes a esta turma',
    );

    return this.audit.transaction(async (tx) => {
      const created = await this.classStudentRepository.create(data, tx);
      await this.audit.record(
        {
          actor: user,
          action: AuditAction.classStudentAdded,
          entityType: 'ClassStudent',
          entityId: classStudentEntityId(data.classId, data.studentId),
          diff: membershipDiff(data.classId, data.studentId, 'added'),
        },
        tx,
      );
      return created;
    });
  }

  /**
   * Listagem de estudantes da turma: dono, admin ou estudante matriculado.
   * Um estudante matriculado pode ver os colegas da mesma turma.
   */
  async getByClassId(
    classId: string,
    query: GetClassStudentsQueryDto,
    user: AuthUser,
  ) {
    const classData = await this.classRepository.getById(classId);
    if (!classData) throw new NotFoundException('Turma não encontrada');

    const isMember = await this.classStudentRepository.isStudentInClass(
      classId,
      user.userId,
    );

    if (
      !isClassOwner(user, classData.professorId) &&
      !isAdmin(user) &&
      !isMember
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para ver os estudantes desta turma',
      );
    }

    return this.classStudentRepository.getByClassId(classId, query);
  }

  /**
   * Remoção de matrícula permitida para:
   * - professor dono da turma (expulsar aluno),
   * - admin,
   * - o próprio estudante (auto-desmatrícula, `studentId === userId`).
   */
  async delete(classId: string, studentId: string, user: AuthUser) {
    const classData = await this.classRepository.getById(classId);
    if (!classData) throw new NotFoundException('Turma não encontrada');

    const isProfessor = isClassOwner(user, classData.professorId);
    const isSelf = studentId === user.userId;

    if (!isProfessor && !isAdmin(user) && !isSelf) {
      throw new ForbiddenException(
        'Você não tem permissão para remover este estudante da turma',
      );
    }

    await this.audit.transaction(async (tx) => {
      await this.classStudentRepository.delete(classId, studentId, tx);
      await this.audit.record(
        {
          actor: user,
          action: AuditAction.classStudentRemoved,
          entityType: 'ClassStudent',
          entityId: classStudentEntityId(classId, studentId),
          diff: membershipDiff(classId, studentId, 'removed'),
        },
        tx,
      );
    });
    return { message: 'Estudante removido da turma com sucesso' };
  }

  isStudentInClass(classId: string, studentId: string) {
    return this.classStudentRepository.isStudentInClass(classId, studentId);
  }
}
