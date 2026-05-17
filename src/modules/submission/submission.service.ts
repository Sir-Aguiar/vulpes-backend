import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { SendFeedbackDto } from './dto/send-feedback.dto';
import { SubmissionRepository } from './repositories/submission.repository';

@Injectable()
export class SubmissionService {
  constructor(private readonly submissionRepository: SubmissionRepository) {}

  create(data: CreateSubmissionDto, user: AuthUser) {
    return this.submissionRepository.create({
      ...data,
      studentId: user.userId,
    });
  }

  getByTaskId(taskId: string) {
    return this.submissionRepository.getByTaskId(taskId);
  }

  getByListId(listId: string) {
    return this.submissionRepository.getByListId(listId);
  }

  sendFeedback(submissionId: string, { professorComments }: SendFeedbackDto) {
    return this.submissionRepository.update(submissionId, {
      professorComments,
    });
  }

  getFeedbacks(user: AuthUser) {
    return this.submissionRepository.getFeedbacks(user.userId);
  }
}
