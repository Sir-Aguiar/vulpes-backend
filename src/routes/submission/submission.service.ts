import { Injectable } from '@nestjs/common';
import { SubmissionRepository } from '../../repositories/submission-repository';
import { ICreateSubmissionDTO } from '../../dtos/Submission';

@Injectable()
export class SubmissionService {
  constructor(private readonly submissionRepository: SubmissionRepository) {}

  async create(data: ICreateSubmissionDTO) {
    const submission = await this.submissionRepository.create(data);
    return submission;
  }
}
