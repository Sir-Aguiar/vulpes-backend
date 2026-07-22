import { ClassTask, ClassTaskList, Submission } from '@prisma/client';
import { CreateSubmissionDto } from '../dto/create-submission.dto';

export interface CreateSubmissionData extends CreateSubmissionDto {
  studentId: string;
}

export interface SubmissionWithRelations extends Submission {
  student?: {
    userId: string;
    email: string;
    name: string;
    institution?: unknown;
  };
  task?: {
    taskId: string;
    title: string;
  };
  classTask?: ClassTask & {
    task?: {
      taskId: string;
      title: string;
    };
  };
  classTaskList?: ClassTaskList & {
    classTask?: ClassTask & {
      task?: {
        taskId: string;
        title: string;
      };
    };
  };
}

export abstract class SubmissionRepository {
  abstract create(data: CreateSubmissionData): Promise<Submission>;
  abstract getByTaskId(taskId: string): Promise<SubmissionWithRelations[]>;
  abstract getByClassTaskId(
    classTaskId: string,
  ): Promise<SubmissionWithRelations[]>;
  abstract getByClassTaskListId(
    classTaskListId: string,
  ): Promise<SubmissionWithRelations[]>;
  abstract countByStudentAndClassTaskListId(
    studentId: string,
    classTaskListId: string,
  ): Promise<number>;
  abstract getFeedbacks(
    studentId: string,
    isWidget: boolean,
  ): Promise<SubmissionWithRelations[]>;
  abstract update(
    submissionId: string,
    data: Partial<Submission>,
  ): Promise<Submission>;
}
