import { BugReport } from '@prisma/client';
import { CreateBugReportInput } from '../dto/create-bug-report.dto';
import { UpdateBugReportInput } from '../dto/update-bug-report.dto';

export type BugReportWithUser = BugReport & {
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
};

export abstract class BugReportRepository {
  abstract create(data: CreateBugReportInput): Promise<BugReport>;
  abstract getById(id: number): Promise<BugReportWithUser | null>;
  abstract getAll(): Promise<BugReportWithUser[]>;
  abstract update(
    id: number,
    data: UpdateBugReportInput,
  ): Promise<BugReportWithUser>;
}
