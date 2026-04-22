import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  ensureResourceOwnership,
  isAdmin,
} from '../../common/authorization/authorization.helpers';
import { AuthUser } from '../../common/types/auth-user.type';
import { ClassTaskRepository } from '../class-task/repositories/class-task.repository';
import { ClassRepository } from '../class/repositories/class.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetLinkableTasksQueryDto } from './dto/get-linkable-tasks.dto';
import { GetTasksQueryDto } from './dto/get-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskWithRelations } from './entities/task.entity';
import { TaskRepository } from './repositories/task.repository';

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    @Inject(forwardRef(() => ClassTaskRepository))
    private readonly classTaskRepository: ClassTaskRepository,
    private readonly classRepository: ClassRepository,
  ) {}

  /**
   * Cria a tarefa e, opcionalmente, a vincula a turmas via `ClassTask`.
   *
   * Regra defensiva: mesmo que o cliente mande `classIds` de turmas que
   * não são suas, o vínculo só é criado para turmas das quais o usuário
   * é o professor (ou para qualquer turma se for ADMIN). Isso evita que
   * um professor "injete" tarefas em turmas alheias via `classIds`.
   */
  async create(
    data: CreateTaskDto,
    user: AuthUser,
  ): Promise<TaskWithRelations> {
    const { classIds, ...rest } = data;

    const task = await this.taskRepository.create({
      ...rest,
      classIds,
      creatorId: user.userId,
    });

    if (classIds && classIds.length > 0) {
      const classes = await this.classRepository.getByIds(classIds);
      const ownedClassIds = classes
        .filter((c) => c.professorId === user.userId || isAdmin(user))
        .map((c) => c.classId);

      await Promise.all(
        ownedClassIds.map((classId) =>
          this.classTaskRepository.create({ classId, taskId: task.taskId }),
        ),
      );
    }

    return task;
  }

  async getById(taskId: string) {
    const task = await this.taskRepository.getById(taskId);
    if (!task) return null;

    const classTasks = await this.classTaskRepository.getByTaskId(taskId);
    return { ...task, classTasks };
  }

  getAll(query: GetTasksQueryDto) {
    return this.taskRepository.getAll(query);
  }

  async update(taskId: string, data: UpdateTaskDto, user: AuthUser) {
    const task = await this.taskRepository.getById(taskId);
    if (!task) throw new NotFoundException('Tarefa não encontrada');

    ensureResourceOwnership(
      user,
      task.creatorId,
      'Você não tem permissão para atualizar esta tarefa',
    );

    if (data.classIds !== undefined) {
      await this.syncTaskClasses(taskId, data.classIds, user);
    }

    const { classIds: _classIds, ...taskData } = data;
    void _classIds;
    return this.taskRepository.update(taskId, taskData);
  }

  /**
   * Exclusão condicional:
   * - Se a tarefa NUNCA foi submetida, removemos fisicamente.
   * - Se já há submissões, fazemos soft delete (marcamos como excluída)
   *   para não quebrar o histórico de submissões dos estudantes.
   *
   * A decisão é sinalizada ao chamador pelo campo `softDelete` na resposta.
   */
  async delete(taskId: string, user: AuthUser) {
    const task = await this.taskRepository.getById(taskId);
    if (!task) throw new NotFoundException('Tarefa não encontrada');

    ensureResourceOwnership(
      user,
      task.creatorId,
      'Você não tem permissão para excluir esta tarefa',
    );

    const submissionCount =
      await this.taskRepository.getSubmissionCount(taskId);
    const useSoftDelete = submissionCount > 0;

    await this.taskRepository.delete(taskId, useSoftDelete);

    return useSoftDelete
      ? {
          message: 'Tarefa marcada como excluída (soft delete)',
          softDelete: true,
        }
      : { message: 'Tarefa excluída permanentemente', softDelete: false };
  }

  getByCreatorId(creatorId: string) {
    return this.taskRepository.getByCreatorId(creatorId);
  }

  /**
   * Lista tarefas que o usuário pode vincular a uma turma, com busca
   * por título, ordenação por `createdAt` e paginação. A filtragem de
   * "quais tarefas são elegíveis" vive no repositório (públicas+visíveis
   * OU criadas pelo usuário, excluindo as já vinculadas).
   */
  async getLinkableToClass(query: GetLinkableTasksQueryDto, user: AuthUser) {
    const { classId, page, limit, search, order } = query;
    return this.taskRepository.getTasksLinkableToClass(classId, user.userId, {
      page,
      limit,
      search,
      order,
    });
  }

  /**
   * Reconcilia o conjunto de turmas vinculadas à tarefa com a lista
   * desejada (`desiredClassIds`), criando/removendo `ClassTask` conforme
   * necessário.
   *
   * Segurança: só é possível ADICIONAR vínculo com turmas das quais o
   * usuário é dono (ou se for ADMIN). Se o cliente tentar vincular a
   * uma turma alheia, lançamos 403 em vez de ignorar silenciosamente —
   * aqui o usuário expressou intenção explícita, então ele merece saber
   * que foi barrado.
   */
  private async syncTaskClasses(
    taskId: string,
    desiredClassIds: string[],
    user: AuthUser,
  ): Promise<void> {
    const currentLinks = await this.classTaskRepository.getByTaskId(taskId);
    const currentClassIds = currentLinks.map((link) => link.classId);

    const toRemove = currentClassIds.filter(
      (id) => !desiredClassIds.includes(id),
    );
    await Promise.all(
      toRemove.map((classId) =>
        this.classTaskRepository.delete(classId, taskId),
      ),
    );

    const toAdd = desiredClassIds.filter((id) => !currentClassIds.includes(id));
    if (toAdd.length === 0) return;

    const classes = await this.classRepository.getByIds(toAdd);
    const allowed = classes.filter(
      (c) => c.professorId === user.userId || isAdmin(user),
    );

    if (allowed.length !== toAdd.length) {
      throw new ForbiddenException(
        'Você não tem permissão para vincular a tarefa a uma ou mais turmas',
      );
    }

    await Promise.all(
      allowed.map((c) =>
        this.classTaskRepository.create({ classId: c.classId, taskId }),
      ),
    );
  }
}
