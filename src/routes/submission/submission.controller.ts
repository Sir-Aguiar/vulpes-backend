import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { ZodValidationPipe } from '../../pipes/Zod.pipe';
import * as Submission from '../../dtos/Submission';

@Controller('submission')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(Submission.CreateSubmissionSchema))
  async create(@Body() body: Submission.ICreateSubmissionDTO) {
    const result = await this.submissionService.create(body);
    return result;
  }
}
