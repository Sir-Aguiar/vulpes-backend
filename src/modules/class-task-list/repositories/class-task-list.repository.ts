import { TaskList } from '@prisma/client';
import { CreateClassTaskListDto } from '../dto/create-class-task-list.dto';
import { GetClassTaskListsQueryDto } from '../dto/get-class-task-lists.dto';

export interface ClassTaskListWithRelations extends TaskList {
  task?: {
    taskId: string;
    title: string;
    description: string;
    isVisible: boolean;
    isPublic: boolean;
    taskParams?: unknown[];
    taskTests?: unknown[];
  };
  list?: {
    listId: string;
    title: string;
    deadline: Date;
    submissionLimit: number | null;
    classId: string;
  };
}

export abstract class ClassTaskListRepository {
  abstract create(data: CreateClassTaskListDto): Promise<TaskList>;
  abstract createMany(
    listId: string,
    taskIds: string[],
  ): Promise<{ count: number }>;
  abstract getByIds(
    taskId: string,
    listId: string,
  ): Promise<ClassTaskListWithRelations | null>;
  abstract getByListId(
    listId: string,
    query: GetClassTaskListsQueryDto,
  ): Promise<{ classTaskLists: ClassTaskListWithRelations[]; total: number }>;
  abstract delete(taskId: string, listId: string): Promise<void>;
  abstract deleteMany(
    listId: string,
    taskIds: string[],
  ): Promise<{ count: number }>;
}
