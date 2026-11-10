import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../common/types/auth-user.type';
import { BugReportNotificationService } from './bug-report-notification.service';
import { CreateBugReportDto } from './dto/create-bug-report.dto';
import { UpdateBugReportInput } from './dto/update-bug-report.dto';
import { BugReportRepository } from './repositories/bug-report.repository';

@Injectable()
export class BugReportService {
  private readonly logger = new Logger(BugReportService.name);

  constructor(
    private readonly repository: BugReportRepository,
    private readonly notificationService: BugReportNotificationService,
  ) {}

  async create(data: CreateBugReportDto, user: AuthUser) {
    const report = await this.repository.create({
      ...data,
      userId: user.userId,
    });

    try {
      await this.notificationService.notify(report, {
        name: user.name,
        email: user.email,
      });
    } catch (error) {
      this.logger.error(
        `Falha inesperada ao notificar o relato #${report.bugReportId}`,
        error,
      );
    }

    return report;
  }

  async getById(id: number) {
    const report = await this.repository.getById(id);
    if (!report) throw new NotFoundException('Report de bug não encontrado');
    return report;
  }

  getAll() {
    return this.repository.getAll();
  }

  update(id: number, data: UpdateBugReportInput) {
    return this.repository.update(id, data);
  }
}
