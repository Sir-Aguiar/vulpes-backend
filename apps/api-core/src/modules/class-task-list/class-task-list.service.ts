import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ensureClassWriteAccess,
  ensureResourceOwnership,
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
    const [classTask, list] = await Promise.all([
      this.classTaskRepository.getById(data.classTaskId),
      this.listRepository.getById(data.listId),
    ]);

    if (!classTask)
      throw new NotFoundException('Tarefa na turma não encontrada');
    if (!list) throw new NotFoundException('Lista não encontrada');

    if (classTask.classId !== list.classId) {
      throw new BadRequestException(
        'A tarefa e a lista não pertencem à mesma turma',
      );
    }

    ensureClassWriteAccess(
      user,
      list.class?.professorId ?? '',
      'Você não tem permissão para adicionar tarefas a esta lista',
    );

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
    const tasks = result.classTaskLists.map(
      ({ classTaskListId, classTask, weight }) => ({
        ...classTask?.task,
        classTaskId: classTask?.classTaskId,
        classTaskListId,
        weight: Number(weight),
      }),
    );
    return { tasks, total: result.total };
  }

  async delete(classTaskListId: string, user: AuthUser) {
    const classTaskList =
      await this.classTaskListRepository.getById(classTaskListId);

    if (!classTaskList)
      throw new NotFoundException('Vínculo de tarefa na lista não encontrado');

    const list = await this.listRepository.getById(classTaskList.listId);
    if (!list) throw new NotFoundException('Lista não encontrada');

    ensureClassWriteAccess(
      user,
      list.class?.professorId ?? '',
      'Você não tem permissão para remover tarefas desta lista',
    );

    await this.classTaskListRepository.delete(classTaskListId);
    return { message: 'Tarefa removida da lista com sucesso' };
  }

  async getDashboardData(user: AuthUser, classId: string, listId: string) {
    const list = await this.listRepository.getById(listId);
    if (!list) throw new NotFoundException('Lista não encontrada');

    if (list.classId !== classId) {
      throw new NotFoundException('Lista não encontrada nesta turma');
    }

    ensureResourceOwnership(user, list.class?.professorId ?? '');

    return this.classTaskListRepository.getDashboardData(classId, listId);
  }
}
