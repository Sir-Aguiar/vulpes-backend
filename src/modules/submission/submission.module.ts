import { Module } from '@nestjs/common';
import { PrismaSubmissionRepository } from './repositories/prisma-submission.repository';
import { SubmissionRepository } from './repositories/submission.repository';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';

@Module({
  controllers: [SubmissionController],
  providers: [
    SubmissionService,
    {
      provide: SubmissionRepository,
      useClass: PrismaSubmissionRepository,
    },
  ],
  exports: [SubmissionService, SubmissionRepository],
})
export class SubmissionModule {}
