import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ListRepository } from '../../repositories/list-repository';
import { ClassRepository } from '../../repositories/class-repository';
import { ClassStudentRepository } from '../../repositories/class-student-repository';
import { ClassTaskRepository } from '../../repositories/class-task-repository';
import { ClassTaskListRepository } from '../../repositories/class-task-list-repository';
import { TaskRepository } from '../../repositories/task-repository';
import {
  ICreateListDTO,
  IGetListsQuery,
  IUpdateListDTO,
} from '../../dtos/List';

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

  async create(data: ICreateListDTO, userId: string, userRole: string) {
    const { taskIds, ...listData } = data;

    const classData = await this.classRepository.getById(listData.classId);
    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (classData.professorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para criar listas nesta turma',
      );
    }

    // If taskIds provided, validate them
    if (taskIds && taskIds.length > 0) {
      const tasks = await this.taskRepository.getByIds(taskIds);
      if (tasks.length !== taskIds.length) {
        const foundIds = tasks.map((t) => t.taskId);
        const missingIds = taskIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `Tarefas não encontradas: ${missingIds.join(', ')}`,
        );
      }

      // Check visibility
      const invisibleTasks = tasks.filter((t) => !t.isVisible);
      if (invisibleTasks.length > 0) {
        throw new BadRequestException(
          `Não é possível adicionar tarefas não visíveis: ${invisibleTasks.map((t) => t.title).join(', ')}`,
        );
      }

      // Check permissions for tasks not owned by user
      if (classData.professorId === userId && userRole !== 'ADMIN') {
        const invalidTasks: string[] = [];
        for (const task of tasks) {
          const isPublicAndVisible = task.isPublic && task.isVisible;
          const isOwnTask = task.creatorId === userId;
          if (!isPublicAndVisible && !isOwnTask) {
            invalidTasks.push(`${task.title} (sem permissão)`);
          }
        }
        if (invalidTasks.length > 0) {
          throw new BadRequestException(
            `Não é possível adicionar as seguintes tarefas: ${invalidTasks.join(', ')}`,
          );
        }
      }
    }

    // Create the list
    const list = await this.listRepository.create(listData);

    // If taskIds provided, add them to the list
    if (taskIds && taskIds.length > 0) {
      // First, check which tasks are already in the class
      const tasksInClass = await this.classTaskRepository.getTasksInClass(
        listData.classId,
        taskIds,
      );
      const tasksNotInClass = taskIds.filter(
        (id) => !tasksInClass.includes(id),
      );

      // Auto-add tasks to class if needed
      if (tasksNotInClass.length > 0) {
        await this.classTaskRepository.createMany(
          listData.classId,
          tasksNotInClass,
        );
      }

      // Add all tasks to the list
      await this.classTaskListRepository.createMany(
        listData.classId,
        list.listId,
        taskIds,
      );
    }

    return {
      ...list,
      tasksAdded: taskIds?.length || 0,
    };
  }

  async getById(listId: string, userId: string, userRole: string) {
    const list = await this.listRepository.getById(listId);

    if (!list) {
      throw new NotFoundException('Lista não encontrada');
    }

    const isStudentInClass = await this.classStudentRepository.isStudentInClass(
      list.classId,
      userId,
    );
    if (
      list.class?.professorId !== userId &&
      userRole !== 'ADMIN' &&
      !isStudentInClass
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para ver esta lista',
      );
    }

    return list;
  }

  async getByIdAndTaskId(
    listId: string,
    taskId: string,
    userId: string,
    userRole: string,
  ) {
    const list = await this.listRepository.getByIdAndTaskId(listId, taskId);

    if (!list) {
      throw new NotFoundException('Lista não encontrada');
    }

    const isStudentInClass = await this.classStudentRepository.isStudentInClass(
      list.classId,
      userId,
    );

    if (
      list.class?.professorId !== userId &&
      userRole !== 'ADMIN' &&
      !isStudentInClass
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para ver esta lista',
      );
    }

    return list;
  }

  async getByClassId(
    classId: string,
    query: IGetListsQuery,
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
        'Você não tem permissão para ver as listas desta turma',
      );
    }

    return await this.listRepository.getByClassId(classId, query);
  }

  async update(
    listId: string,
    data: IUpdateListDTO,
    userId: string,
    userRole: string,
  ) {
    const list = await this.listRepository.getById(listId);
    if (!list) {
      throw new NotFoundException('Lista não encontrada');
    }

    if (list.class?.professorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar esta lista',
      );
    }

    return await this.listRepository.update(listId, data);
  }

  async delete(listId: string, userId: string, userRole: string) {
    const list = await this.listRepository.getById(listId);
    if (!list) {
      throw new NotFoundException('Lista não encontrada');
    }

    if (list.class?.professorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para excluir esta lista',
      );
    }

    await this.listRepository.delete(listId);
    return { message: 'Lista excluída com sucesso' };
  }
}
