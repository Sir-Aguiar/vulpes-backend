import { Injectable } from '@nestjs/common';
import { ICreateTaskDTO } from '../../dtos/Task';
import { TaskRepository } from '../../repositories/task-repository';

@Injectable()
export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async create(data: ICreateTaskDTO) {
    return await this.taskRepository.create(data);
  }

  async getById(id: string) {
    const task = await this.taskRepository.getById(id);

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }
}
