import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ICreateTaskDTO,
  IGetTasksQuery,
  IUpdateTaskDTO,
} from '../../dtos/Task';
import { TaskRepository } from '../../repositories/task-repository';
import { ClassTaskRepository } from '../../repositories/class-task-repository';
import { ClassRepository } from '../../repositories/class-repository';
import { ITask } from '../../entities/Task';

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly classTaskRepository: ClassTaskRepository,
    private readonly classRepository: ClassRepository,
  ) {}

  async create(data: ICreateTaskDTO & { creatorId: string }) {
    const { classIds } = data;
    const task = await this.taskRepository.create(data);

    if (classIds && classIds.length > 0) {
      const classes = await this.classRepository.getByIds(classIds);
      const ownedClassIds = classes
        .filter((classItem) => classItem.professorId === data.creatorId)
        .map((classItem) => classItem.classId);

      await Promise.all(
        ownedClassIds.map((classId) =>
          this.classTaskRepository.create({
            classId,
            taskId: task.taskId,
          }),
        ),
      );
    }

    return task;
  }

  async getById(id: string): Promise<(ITask & { classTasks?: any[] }) | null> {
    const task = await this.taskRepository.getById(id);
    if (!task) return null;

    const classTasks = await this.classTaskRepository.getByTaskId(id);
    return {
      ...task,
      classTasks,
    };
  }

  async getAll(query: IGetTasksQuery) {
    return await this.taskRepository.getAll(query);
  }

  async update(
    taskId: string,
    data: IUpdateTaskDTO,
    userId: string,
    userRole: string,
  ) {
    const task = await this.taskRepository.getById(taskId);

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    // Check ownership: only creator or admin can update
    if (task.creatorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar esta tarefa',
      );
    }

    const { classIds, ...taskData } = data;

    // Handle class-task relations if classIds provided
    if (classIds !== undefined) {
      // Get current class-task relations
      const currentClassTasks =
        await this.classTaskRepository.getByTaskId(taskId);
      const currentClassIds = currentClassTasks.map((ct) => ct.classId);

      // Remove class-tasks that are no longer in the list
      for (const classId of currentClassIds) {
        if (!classIds.includes(classId)) {
          await this.classTaskRepository.delete(classId, taskId);
        }
      }

      // Add new class-tasks
      const classIdsToAdd = classIds.filter(
        (classId) => !currentClassIds.includes(classId),
      );

      if (classIdsToAdd.length > 0) {
        const classes = await this.classRepository.getByIds(classIdsToAdd);
        const allowedClassIds = classes
          .filter(
            (classItem) =>
              classItem.professorId === userId || userRole === 'ADMIN',
          )
          .map((classItem) => classItem.classId);

        await Promise.all(
          allowedClassIds.map((classId) =>
            this.classTaskRepository.create({
              classId,
              taskId,
            }),
          ),
        );
      }
    }

    return await this.taskRepository.update(taskId, taskData);
  }

  async delete(taskId: string, userId: string, userRole: string) {
    const task = await this.taskRepository.getById(taskId);

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    if (task.creatorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para excluir esta tarefa',
      );
    }

    const hasSubmissions =
      (await this.taskRepository.getSubmissionCount(taskId)) > 0;

    if (hasSubmissions) {
      // Soft delete: preserve data for submissions
      await this.taskRepository.delete(taskId, true);
      return {
        message: 'Tarefa marcada como excluída (soft delete)',
        softDelete: true,
      };
    } else {
      // Hard delete: no submissions, safe to remove
      await this.taskRepository.delete(taskId, false);
      return { message: 'Tarefa excluída permanentemente', softDelete: false };
    }
  }

  async getByCreatorId(creatorId: string): Promise<ITask[]> {
    return await this.taskRepository.getByCreatorId(creatorId);
  }
}
