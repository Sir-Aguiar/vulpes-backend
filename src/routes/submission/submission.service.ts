import { Injectable } from '@nestjs/common';
import { SubmissionRepository } from '../../repositories/submission-repository';
import { ICreateSubmissionDTO, ISendFeedbackDTO } from '../../dtos/Submission';

@Injectable()
export class SubmissionService {
  constructor(private readonly submissionRepository: SubmissionRepository) {}

  async create(data: ICreateSubmissionDTO) {
    const submission = await this.submissionRepository.create(data);
    return submission;
  }

  async getByTaskId(taskId: string) {
    return this.submissionRepository.getSubmissionsByTaskId(taskId);
  }

  async sendFeedback(id: string, { professorComments }: ISendFeedbackDTO) {
    return this.submissionRepository.update(id, {
      professorComments,
    });
  }
}
