import { Module, forwardRef } from '@nestjs/common';
import { ClassTaskListModule } from '../class-task-list/class-task-list.module';
import { ClassTaskModule } from '../class-task/class-task.module';
import { PrismaSubmissionRepository } from './repositories/prisma-submission.repository';
import { SubmissionRepository } from './repositories/submission.repository';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';

@Module({
  imports: [
    forwardRef(() => ClassTaskModule),
    forwardRef(() => ClassTaskListModule),
  ],
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
