import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  ensureClassWriteAccess,
  isAdmin,
  isClassOwner,
} from '../../common/authorization/authorization.helpers';
import { AuthUser } from '../../common/types/auth-user.type';
import { ClassStudentRepository } from '../class-student/repositories/class-student.repository';
import { ClassRepository } from '../class/repositories/class.repository';
import { TaskRepository } from '../task/repositories/task.repository';
import { CreateClassTaskDto } from './dto/create-class-task.dto';
import { GetClassTasksQueryDto } from './dto/get-class-tasks.dto';
import { ClassTaskRepository } from './repositories/class-task.repository';

@Injectable()
export class ClassTaskService {
  constructor(
    private readonly classTaskRepository: ClassTaskRepository,
    private readonly classRepository: ClassRepository,
    @Inject(forwardRef(() => TaskRepository))
    private readonly taskRepository: TaskRepository,
    private readonly classStudentRepository: ClassStudentRepository,
  ) {}

  /**
   * Vincula uma tarefa existente a uma turma.
   *
   * Regras de acesso (em ordem):
   * 1. O usuário deve ser dono da turma ou ADMIN (escrita na turma).
   * 2. A tarefa deve existir e ter `isVisible = true`.
   * 3. Professor dono (não-admin): só pode vincular tarefas que ele criou
   *    OU tarefas públicas e visíveis. ADMIN escapa dessa restrição.
   *
   * Regra (3) impede que um professor vincule tarefas privadas de outros
   * professores através desse endpoint.
   */
  async create(data: CreateClassTaskDto, user: AuthUser) {
    const classData = await this.classRepository.getById(data.classId);
    if (!classData) throw new NotFoundException('Turma não encontrada');

    ensureClassWriteAccess(
      user,
      classData.professorId,
      'Você não tem permissão para adicionar tarefas a esta turma',
    );

    const task = await this.taskRepository.getById(data.taskId);
    if (!task) throw new NotFoundException('Tarefa não encontrada');

    if (!task.isVisible) {
      throw new BadRequestException(
        'Não é possível adicionar uma tarefa não visível à turma',
      );
    }

    const isOwnerNotAdmin =
      isClassOwner(user, classData.professorId) && !isAdmin(user);
    const canUseTask =
      task.creatorId === user.userId || (task.isPublic && task.isVisible);

    if (isOwnerNotAdmin && !canUseTask) {
      throw new ForbiddenException(
        'Você só pode adicionar tarefas públicas e visíveis, ou tarefas criadas por você',
      );
    }

    return this.classTaskRepository.create(data);
  }

  /**
   * Regra de leitura: dono da turma, admin ou estudante matriculado.
   * Estudantes não matriculados não enxergam as tarefas da turma.
   */
  async getByClassId(
    classId: string,
    query: GetClassTasksQueryDto,
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
        'Você não tem permissão para ver as tarefas desta turma',
      );
    }

    return this.classTaskRepository.getByClassId(classId, query);
  }

  async delete(classId: string, taskId: string, user: AuthUser) {
    const classData = await this.classRepository.getById(classId);
    if (!classData) throw new NotFoundException('Turma não encontrada');

    ensureClassWriteAccess(
      user,
      classData.professorId,
      'Você não tem permissão para remover tarefas desta turma',
    );

    const link = await this.classTaskRepository.getByIds(classId, taskId);
    if (!link) throw new NotFoundException('Tarefa não encontrada na turma');

    await this.classTaskRepository.delete(classId, taskId);
    return { message: 'Tarefa removida da turma com sucesso' };
  }
}
