import { Module } from '@nestjs/common';
import {
  PrismaSubmissionRepository,
  SubmissionRepository,
} from '../../repositories/submission-repository';
import { SubmissionService } from './submission.service';
import { SubmissionController } from './submission.controller';

@Module({
  controllers: [SubmissionController],
  providers: [
    SubmissionService,
    {
      provide: SubmissionRepository,
      useClass: PrismaSubmissionRepository,
    },
  ],
})
export class SubmissionModule {}
