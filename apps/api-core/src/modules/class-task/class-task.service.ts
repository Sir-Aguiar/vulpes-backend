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
  ensureResourceOwnership,
  isAdmin,
  isClassOwner,
} from '../../common/authorization/authorization.helpers';
import { AuthUser } from '../../common/types/auth-user.type';
import { ClassStudentRepository } from '../class-student/repositories/class-student.repository';
import { ClassRepository } from '../class/repositories/class.repository';
import { TaskRepository } from '../task/repositories/task.repository';
import { serializeClassTask } from './class-task.serializer';
import { CreateClassTaskDto } from './dto/create-class-task.dto';
import { GetClassTasksQueryDto } from './dto/get-class-tasks.dto';
import { MY_TASKS_PER_CLASS, MyTasksResponse } from './dto/my-tasks.dto';
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

  async getById(classTaskId: string, user: AuthUser) {
    const classTask = await this.classTaskRepository.getById(classTaskId);
    if (!classTask)
      throw new NotFoundException('Tarefa na turma não encontrada');

    const isMember = await this.classStudentRepository.isStudentInClass(
      classTask.classId,
      user.userId,
    );

    if (
      !isClassOwner(user, classTask.class?.professorId ?? '') &&
      !isAdmin(user) &&
      !isMember
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para ver esta tarefa',
      );
    }

    return serializeClassTask(classTask);
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

  /**
   * Página "Minhas tarefas": tarefas visíveis das turmas em que o aluno está
   * matriculado, agrupadas por turma (máx. 5 mais recentes por turma).
   */
  async getMyTasks(user: AuthUser): Promise<MyTasksResponse> {
    const rows = await this.classTaskRepository.getVisibleClassTasksByStudentId(
      user.userId,
    );

    const grouped = new Map<
      string,
      {
        class: (typeof rows)[number]['class'];
        tasks: (typeof rows)[number][];
      }
    >();

    for (const row of rows) {
      const section = grouped.get(row.class.classId);
      if (section) {
        section.tasks.push(row);
        continue;
      }
      grouped.set(row.class.classId, { class: row.class, tasks: [row] });
    }

    const classes = [...grouped.values()]
      .sort((a, b) => a.class.name.localeCompare(b.class.name, 'pt-BR'))
      .map(({ class: classData, tasks }) => ({
        class: classData,
        tasks: tasks
          .slice(0, MY_TASKS_PER_CLASS)
          .map(({ classTaskId, taskId, createdAt, task }) => ({
            classTaskId,
            taskId,
            createdAt,
            task,
          })),
        totalTasks: tasks.length,
        hasMore: tasks.length > MY_TASKS_PER_CLASS,
      }));

    return { classes };
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

  async getDashboardData(user: AuthUser, classId: string, taskId: string) {
    const classData = await this.classRepository.getById(classId);

    if (!classData) throw new NotFoundException('Turma não encontrada');

    ensureResourceOwnership(user, classData.professorId);

    const classTask = await this.classTaskRepository.getByIds(classId, taskId);
    if (!classTask)
      throw new NotFoundException('Tarefa não vinculada a esta turma');

    return this.classTaskRepository.getDashboardData(
      classId,
      classTask.classTaskId,
    );
  }
}
