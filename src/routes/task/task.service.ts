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
import { ITask } from '../../entities/Task';

@Injectable()
export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async create(data: ICreateTaskDTO & { creatorId: string }) {
    return await this.taskRepository.create(data);
  }

  async getById(id: string): Promise<ITask | null> {
    return await this.taskRepository.getById(id);
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

    return await this.taskRepository.update(taskId, data);
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
