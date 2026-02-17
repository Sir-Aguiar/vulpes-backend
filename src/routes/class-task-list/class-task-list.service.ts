import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ClassTaskListRepository } from '../../repositories/class-task-list-repository';
import { ListRepository } from '../../repositories/list-repository';
import { ClassTaskRepository } from '../../repositories/class-task-repository';
import { ClassStudentRepository } from '../../repositories/class-student-repository';
import {
  ICreateClassTaskListDTO,
  IGetClassTaskListsQuery,
} from '../../dtos/ClassTaskList';

@Injectable()
export class ClassTaskListService {
  constructor(
    private readonly classTaskListRepository: ClassTaskListRepository,
    private readonly listRepository: ListRepository,
    private readonly classTaskRepository: ClassTaskRepository,
    private readonly classStudentRepository: ClassStudentRepository,
  ) {}

  async create(
    data: ICreateClassTaskListDTO,
    userId: string,
    userRole: string,
  ) {
    const list = await this.listRepository.getById(data.listId);
    if (!list) {
      throw new NotFoundException('Lista não encontrada');
    }

    if (list.classId !== data.classId) {
      throw new BadRequestException(
        'A lista não pertence à turma especificada',
      );
    }
    if (list.class?.professorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para adicionar tarefas a esta lista',
      );
    }
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

    return await this.classTaskListRepository.create(data);
  }

  async getTasksByListId(
    listId: string,
    query: IGetClassTaskListsQuery,
    userId: string,
    userRole: string,
  ) {
    const list = await this.listRepository.getById(listId);
    if (!list) {
      throw new NotFoundException('Lista não encontrada');
    }

    const isStudentInClass = await this.classStudentRepository.isStudentInClass(
      list.classId,
      userId,
    );

    const isOwner = list.class?.professorId !== userId;

    if (!isOwner && userRole !== 'ADMIN' && !isStudentInClass) {
      throw new ForbiddenException(
        'Você não tem permissão para ver as tarefas desta lista',
      );
    }

    const result = await this.classTaskListRepository.getByListId(
      listId,
      query,
    );

    const tasks = result.classTaskLists.map(({ classTask }) => ({
      ...classTask?.task,
    }));

    return { tasks, total: result.total };
  }

  async delete(
    classId: string,
    taskId: string,
    listId: string,
    userId: string,
    userRole: string,
  ) {
    const list = await this.listRepository.getById(listId);
    if (!list) {
      throw new NotFoundException('Lista não encontrada');
    }

    if (list.class?.professorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para remover tarefas desta lista',
      );
    }

    await this.classTaskListRepository.delete(classId, taskId, listId);
    return { message: 'Tarefa removida da lista com sucesso' };
  }
}
