import { CreateTaskDto } from '../dto/create-task.dto';
import { GetTasksQueryDto } from '../dto/get-tasks.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskWithRelations } from '../entities/task.entity';

export interface CreateTaskData extends CreateTaskDto {
  creatorId: string;
}

export abstract class TaskRepository {
  abstract create(data: CreateTaskData): Promise<TaskWithRelations>;
  abstract getById(taskId: string): Promise<TaskWithRelations | null>;
  abstract getByIds(taskIds: string[]): Promise<TaskWithRelations[]>;
  abstract getAll(
    query: GetTasksQueryDto,
  ): Promise<{ tasks: TaskWithRelations[]; total: number }>;
  abstract update(
    taskId: string,
    data: UpdateTaskDto,
  ): Promise<TaskWithRelations>;
  abstract delete(taskId: string, soft?: boolean): Promise<void>;
  abstract getByCreatorId(creatorId: string): Promise<TaskWithRelations[]>;
  abstract getSubmissionCount(taskId: string): Promise<number>;
  abstract getTasksLinkableToClass(
    classId: string,
    creatorId: string,
  ): Promise<TaskWithRelations[]>;
}
