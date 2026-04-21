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
import { ClassTaskRepository } from '../class-task/repositories/class-task.repository';
import { ListRepository } from '../list/repositories/list.repository';
import { CreateClassTaskListDto } from './dto/create-class-task-list.dto';
import { GetClassTaskListsQueryDto } from './dto/get-class-task-lists.dto';
import { ClassTaskListRepository } from './repositories/class-task-list.repository';

@Injectable()
export class ClassTaskListService {
  constructor(
    private readonly classTaskListRepository: ClassTaskListRepository,
    private readonly listRepository: ListRepository,
    private readonly classTaskRepository: ClassTaskRepository,
    private readonly classStudentRepository: ClassStudentRepository,
  ) {}

  async create(data: CreateClassTaskListDto, user: AuthUser) {
    const list = await this.listRepository.getById(data.listId);
    if (!list) throw new NotFoundException('Lista não encontrada');

    if (list.classId !== data.classId) {
      throw new BadRequestException(
        'A lista não pertence à turma especificada',
      );
    }

    ensureClassWriteAccess(
      user,
      list.class?.professorId ?? '',
      'Você não tem permissão para adicionar tarefas a esta lista',
    );

    const classTask = await this.classTaskRepository.getByIds(
      data.classId,
      data.taskId,
    );
    if (!classTask) {
      throw new BadRequestException(
        'A tarefa deve estar associada à turma antes de ser adicionada à lista',
      );
    }

    if (classTask.task && !classTask.task.isVisible) {
      throw new BadRequestException(
        'Não é possível adicionar uma tarefa não visível à lista',
      );
    }

    return this.classTaskListRepository.create(data);
  }

  async getTasksByListId(
    listId: string,
    query: GetClassTaskListsQueryDto,
    user: AuthUser,
  ) {
    const list = await this.listRepository.getById(listId);
    if (!list) throw new NotFoundException('Lista não encontrada');

    const isOwner =
      list.class?.professorId !== undefined &&
      isClassOwner(user, list.class.professorId);
    const isMember = await this.classStudentRepository.isStudentInClass(
      list.classId,
      user.userId,
    );

    if (!isOwner && !isAdmin(user) && !isMember) {
      throw new ForbiddenException(
        'Você não tem permissão para ver as tarefas desta lista',
      );
    }

    const result = await this.classTaskListRepository.getByListId(
      listId,
      query,
    );
    const tasks = result.classTaskLists.map(({ task }) => ({ ...task }));
    return { tasks, total: result.total };
  }

  async delete(
    classId: string,
    taskId: string,
    listId: string,
    user: AuthUser,
  ) {
    void classId;
    const list = await this.listRepository.getById(listId);
    if (!list) throw new NotFoundException('Lista não encontrada');

    ensureClassWriteAccess(
      user,
      list.class?.professorId ?? '',
      'Você não tem permissão para remover tarefas desta lista',
    );

    await this.classTaskListRepository.delete(taskId, listId);
    return { message: 'Tarefa removida da lista com sucesso' };
  }
}
