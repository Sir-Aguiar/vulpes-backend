import { ClassTask, Task } from '@prisma/client';
import { CreateClassTaskDto } from '../dto/create-class-task.dto';
import { GetClassTasksQueryDto } from '../dto/get-class-tasks.dto';

export interface ClassTaskWithRelations extends ClassTask {
  task?: Task & {
    taskParams?: unknown[];
    taskTests?: { input: string[]; [key: string]: unknown }[];
    creator?: {
      userId: string;
      name: string;
    };
  };
  class?: {
    classId: string;
    name: string;
    code: number;
    professorId: string;
  };
}

export interface IDashboardData {
  students: {
    studentId: string;
    name: string;
    lastSubmission: {
      submissionId: string;
      isCorrect: boolean;
      submittedAt: Date;
      code: string;
      professorComments: string | null;
    };
  }[];
}

export abstract class ClassTaskRepository {
  abstract create(data: CreateClassTaskDto): Promise<ClassTask>;
  abstract createMany(
    classId: string,
    taskIds: string[],
  ): Promise<{ count: number }>;
  abstract getById(
    classTaskId: string,
  ): Promise<ClassTaskWithRelations | null>;
  abstract getByIds(
    classId: string,
    taskId: string,
  ): Promise<ClassTaskWithRelations | null>;
  abstract getByClassId(
    classId: string,
    query: GetClassTasksQueryDto,
  ): Promise<{ classTasks: ClassTaskWithRelations[]; total: number }>;
  abstract getByTaskId(taskId: string): Promise<ClassTaskWithRelations[]>;
  abstract getByClassIdAndTaskIds(
    classId: string,
    taskIds: string[],
  ): Promise<ClassTask[]>;
  abstract delete(classId: string, taskId: string): Promise<void>;
  abstract deleteMany(
    classId: string,
    taskIds: string[],
  ): Promise<{ count: number }>;
  abstract isTaskInClass(classId: string, taskId: string): Promise<boolean>;
  abstract getTasksInClass(
    classId: string,
    taskIds: string[],
  ): Promise<string[]>;
  abstract getDashboardData(
    classId: string,
    taskId: string,
  ): Promise<IDashboardData>;
}
