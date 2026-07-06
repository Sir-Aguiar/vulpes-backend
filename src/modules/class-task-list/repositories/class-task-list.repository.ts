import { ClassTaskList } from '@prisma/client';
import { CreateClassTaskListDto } from '../dto/create-class-task-list.dto';
import { GetClassTaskListsQueryDto } from '../dto/get-class-task-lists.dto';

export interface ClassTaskListWeightInput {
  classTaskId: string;
  weight?: number;
}

export interface ClassTaskListWithRelations extends ClassTaskList {
  classTask?: {
    classTaskId: string;
    classId: string;
    taskId: string;
    task?: {
      taskId: string;
      title: string;
      description: string;
      isVisible: boolean;
      isPublic: boolean;
      taskParams?: unknown[];
      taskTests?: unknown[];
    };
  };
  list?: {
    listId: string;
    title: string;
    deadline: Date;
    releaseDate: Date;
    submissionLimit: number | null;
    classId: string;
  };
}

export abstract class ClassTaskListRepository {
  abstract create(data: CreateClassTaskListDto): Promise<ClassTaskList>;
  abstract createMany(
    listId: string,
    tasks: ClassTaskListWeightInput[],
  ): Promise<{ count: number }>;
  abstract getByIds(
    classTaskId: string,
    listId: string,
  ): Promise<ClassTaskListWithRelations | null>;
  abstract getById(
    classTaskListId: string,
  ): Promise<ClassTaskListWithRelations | null>;
  abstract getByListId(
    listId: string,
    query: GetClassTaskListsQueryDto,
  ): Promise<{ classTaskLists: ClassTaskListWithRelations[]; total: number }>;
  abstract delete(classTaskListId: string): Promise<void>;
  abstract deleteMany(
    listId: string,
    classTaskIds: string[],
  ): Promise<{ count: number }>;
}
