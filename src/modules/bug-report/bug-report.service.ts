import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../common/types/auth-user.type';
import { CreateBugReportDto } from './dto/create-bug-report.dto';
import { UpdateBugReportInput } from './dto/update-bug-report.dto';
import { BugReportRepository } from './repositories/bug-report.repository';

@Injectable()
export class BugReportService {
  constructor(private readonly repository: BugReportRepository) {}

  create(data: CreateBugReportDto, user: AuthUser) {
    return this.repository.create({
      ...data,
      userId: user.userId,
    });
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
