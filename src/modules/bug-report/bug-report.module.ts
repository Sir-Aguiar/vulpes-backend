import { Module } from '@nestjs/common';
import { EmailerModule } from '../../infra/emailer/emailer.module';
import { StorageModule } from '../../infra/storage/storage.module';
import { UserModule } from '../user/user.module';
import { BugReportController } from './bug-report.controller';
import { BugReportNotificationService } from './bug-report-notification.service';
import { BugReportService } from './bug-report.service';
import { BugReportRepository } from './repositories/bug-report.repository';
import { PrismaBugReportRepository } from './repositories/prisma-bug-report.repository';

@Module({
  imports: [StorageModule, UserModule, EmailerModule],
  controllers: [BugReportController],
  providers: [
    BugReportService,
    BugReportNotificationService,
    {
      provide: BugReportRepository,
      useClass: PrismaBugReportRepository,
    },
  ],
  exports: [BugReportService, BugReportRepository],
})
export class BugReportModule {}
