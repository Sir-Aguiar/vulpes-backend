import { Submission } from '@prisma/client';
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
}

export abstract class SubmissionRepository {
  abstract create(data: CreateSubmissionData): Promise<Submission>;
  abstract getByTaskId(taskId: string): Promise<SubmissionWithRelations[]>;
  abstract getByListId(listId: string): Promise<SubmissionWithRelations[]>;
  abstract getFeedbacks(studentId: string): Promise<SubmissionWithRelations[]>;
  abstract update(
    submissionId: string,
    data: Partial<Submission>,
  ): Promise<Submission>;
}
