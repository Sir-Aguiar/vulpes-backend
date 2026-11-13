import { AuditActor } from '../../audit/audit.types';
import { CreateTaskDto } from '../dto/create-task.dto';
import { LinkableTask } from '../dto/get-linkable-tasks.dto';
import {
  GetPublishedTasksQueryDto,
  PublishedTask,
} from '../dto/get-published-tasks.dto';
import { GetTasksQueryDto } from '../dto/get-tasks.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskWithRelations } from '../entities/task.entity';

export interface CreateTaskData extends CreateTaskDto {
  creatorId: string;
}

export interface TaskAuditContext {
  actor: AuditActor;
  before: {
    isVisible: boolean;
    isPublic: boolean;
    deletedAt: Date | null;
  };
}

export interface LinkableTasksOptions {
  page: number;
  limit: number;
  search?: string;
  order: 'asc' | 'desc';
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
    audit?: TaskAuditContext,
  ): Promise<TaskWithRelations>;
  abstract delete(
    taskId: string,
    soft?: boolean,
    audit?: TaskAuditContext,
  ): Promise<void>;
  abstract getByCreatorId(creatorId: string): Promise<TaskWithRelations[]>;
  abstract getSubmissionCount(taskId: string): Promise<number>;
  abstract getTasksLinkableToClass(
    classId: string,
    creatorId: string,
    options: LinkableTasksOptions,
  ): Promise<{ tasks: LinkableTask[]; total: number }>;
  abstract getPublishedTasks(
    query: GetPublishedTasksQueryDto,
  ): Promise<{ tasks: PublishedTask[]; total: number }>;
}
