import {
  BadRequestException,
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
import { ClassStudentRepository } from '../class-student/repositories/class-student.repository';
import { ClassTaskListRepository } from '../class-task-list/repositories/class-task-list.repository';
import { ClassTaskRepository } from '../class-task/repositories/class-task.repository';
import { ClassRepository } from '../class/repositories/class.repository';
import { TaskRepository } from '../task/repositories/task.repository';
import { TaskWithRelations } from '../task/entities/task.entity';
import { CreateListDto } from './dto/create-list.dto';
import { GetListsQueryDto } from './dto/get-lists.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ListRepository } from './repositories/list.repository';

@Injectable()
export class ListService {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly classRepository: ClassRepository,
    private readonly classStudentRepository: ClassStudentRepository,
    private readonly classTaskRepository: ClassTaskRepository,
    private readonly classTaskListRepository: ClassTaskListRepository,
    private readonly taskRepository: TaskRepository,
  ) {}

  /**
   * Cria uma lista e, opcionalmente, associa tarefas já na criação.
   *
   * Fluxo com `taskIds`:
   * 1. Valida escrita na turma + tarefas válidas (via `validateTasks`).
   * 2. Cria a lista.
   * 3. Garante que cada tarefa esteja vinculada à turma (`ClassTask`) —
   *    cria os vínculos faltantes.
   * 4. Associa as tarefas à lista (`ClassTaskList`).
   *
   * O passo 3 existe porque a API trata "adicionar tarefa a uma lista"
   * como UX mais natural que "vincule à turma, depois à lista".
   *
   * @returns A lista criada com `tasksAdded` = quantidade de tarefas associadas.
   */
  async create(data: CreateListDto, user: AuthUser) {
    const { tasks, ...listData } = data;
    const taskIds = tasks.map((task) => task.taskId);

    const classData = await this.classRepository.getById(listData.classId);
    if (!classData) throw new NotFoundException('Turma não encontrada');

    ensureClassWriteAccess(
      user,
      classData.professorId,
      'Você não tem permissão para criar listas nesta turma',
    );

    const validatedTasks = await this.validateTasks(
      taskIds,
      user,
      classData.professorId,
    );

    const list = await this.listRepository.create(listData);

    if (validatedTasks.length > 0) {
      const tasksInClass = await this.classTaskRepository.getTasksInClass(
        listData.classId,
        taskIds,
      );
      const tasksNotInClass = taskIds.filter(
        (id) => !tasksInClass.includes(id),
      );

      if (tasksNotInClass.length > 0) {
        await this.classTaskRepository.createMany(
          listData.classId,
          tasksNotInClass,
        );
      }

      // Resolve taskId → classTaskId para o novo modelo ClassTaskList
      const classTasks = await this.classTaskRepository.getByClassIdAndTaskIds(
        listData.classId,
        taskIds,
      );
      const classTaskIdByTaskId = new Map(
        classTasks.map((ct) => [ct.taskId, ct.classTaskId]),
      );

      const classTaskListItems = tasks
        .map((task) => ({
          classTaskId: classTaskIdByTaskId.get(task.taskId),
          weight: task.weight,
        }))
        .filter(
          (item): item is { classTaskId: string; weight: number } =>
            item.classTaskId !== undefined,
        );

      await this.classTaskListRepository.createMany(
        list.listId,
        classTaskListItems,
      );
    }

    return { ...list, tasksAdded: tasks.length };
  }

  async getById(listId: string, user: AuthUser) {
    const list = await this.listRepository.getById(listId);

    if (!list) throw new NotFoundException('Lista não encontrada');

    await this.assertReadAccess(list.classId, list.class?.professorId, user);

    return list;
  }

  async getByIdAndTaskId(listId: string, taskId: string, user: AuthUser) {
    const list = await this.listRepository.getByIdAndTaskId(listId, taskId);
    if (!list) throw new NotFoundException('Lista não encontrada');

    await this.assertReadAccess(list.classId, list.class?.professorId, user);
    return list;
  }

  async getByClassId(classId: string, query: GetListsQueryDto, user: AuthUser) {
    const classData = await this.classRepository.getById(classId);
    if (!classData) throw new NotFoundException('Turma não encontrada');

    await this.assertReadAccess(classId, classData.professorId, user);
    return this.listRepository.getByClassId(classId, query);
  }

  async update(listId: string, data: UpdateListDto, user: AuthUser) {
    const list = await this.listRepository.getById(listId);
    if (!list) throw new NotFoundException('Lista não encontrada');

    ensureClassWriteAccess(
      user,
      list.class?.professorId ?? '',
      'Você não tem permissão para atualizar esta lista',
    );

    return this.listRepository.update(listId, data);
  }

  async delete(listId: string, user: AuthUser) {
    const list = await this.listRepository.getById(listId);
    if (!list) throw new NotFoundException('Lista não encontrada');

    ensureClassWriteAccess(
      user,
      list.class?.professorId ?? '',
      'Você não tem permissão para excluir esta lista',
    );

    await this.listRepository.delete(listId);
    return { message: 'Lista excluída com sucesso' };
  }

  /**
   * Regra de leitura para listas: admin, dono da turma ou estudante
   * matriculado. Como este check é repetido em várias rotas
   * (`getById`, `getByIdAndTaskId`, `getByClassId`), ele vive aqui.
   */
  private async assertReadAccess(
    classId: string,
    professorId: string | undefined,
    user: AuthUser,
  ): Promise<void> {
    if (isAdmin(user)) return;
    if (professorId && isClassOwner(user, professorId)) return;

    const isMember = await this.classStudentRepository.isStudentInClass(
      classId,
      user.userId,
    );

    if (!isMember) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso',
      );
    }
  }

  /**
   * Valida o conjunto de tarefas que o cliente quer associar à lista.
   *
   * Checa, nesta ordem:
   * 1. Todas as tarefas existem (404 com ids faltantes).
   * 2. Nenhuma delas está invisível (400 com títulos conflitantes).
   * 3. Se o usuário é o professor dono (mas não admin), cada tarefa deve
   *    ser pública+visível OU criada por ele (evita "sequestro" de tarefas
   *    privadas de outros professores).
   *
   * Retorna as tarefas carregadas para permitir reuso pelo chamador.
   */
  private async validateTasks(
    taskIds: string[] | undefined,
    user: AuthUser,
    classProfessorId: string,
  ): Promise<TaskWithRelations[]> {
    if (!taskIds || taskIds.length === 0) return [];

    const tasks = await this.taskRepository.getByIds(taskIds);
    if (tasks.length !== taskIds.length) {
      const foundIds = new Set(tasks.map((t) => t.taskId));
      const missing = taskIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Tarefas não encontradas: ${missing.join(', ')}`,
      );
    }

    const invisible = tasks.filter((t) => !t.isVisible);
    if (invisible.length > 0) {
      throw new BadRequestException(
        `Não é possível adicionar tarefas não visíveis: ${invisible
          .map((t) => t.title)
          .join(', ')}`,
      );
    }

    if (isClassOwner(user, classProfessorId) && !isAdmin(user)) {
      const invalid = tasks
        .filter(
          (t) => !((t.isPublic && t.isVisible) || t.creatorId === user.userId),
        )
        .map((t) => `${t.title} (sem permissão)`);

      if (invalid.length > 0) {
        throw new BadRequestException(
          `Não é possível adicionar as seguintes tarefas: ${invalid.join(', ')}`,
        );
      }
    }

    return tasks;
  }
}
