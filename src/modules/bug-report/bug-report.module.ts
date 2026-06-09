import { Module } from '@nestjs/common';
import { StorageModule } from '../../infra/storage/storage.module';
import { BugReportController } from './bug-report.controller';
import { BugReportService } from './bug-report.service';
import { BugReportRepository } from './repositories/bug-report.repository';
import { PrismaBugReportRepository } from './repositories/prisma-bug-report.repository';

@Module({
  imports: [StorageModule],
  controllers: [BugReportController],
  providers: [
    BugReportService,
    {
      provide: BugReportRepository,
      useClass: PrismaBugReportRepository,
    },
  ],
  exports: [BugReportService, BugReportRepository],
})
export class BugReportModule {}
