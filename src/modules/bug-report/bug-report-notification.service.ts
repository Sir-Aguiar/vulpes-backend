import { Injectable, Logger } from '@nestjs/common';
import { BugReport, Role } from '@prisma/client';
import { renderFile } from 'ejs';
import { resolve } from 'path';
import { EnvService } from '../../config/env.service';
import { EmailerService } from '../../infra/emailer/emailer.service';
import { UserRepository } from '../user/repositories/user.repository';

type BugReportReporter = {
  name: string;
  email: string;
};

@Injectable()
export class BugReportNotificationService {
  private readonly logger = new Logger(BugReportNotificationService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailerService: EmailerService,
    private readonly envService: EnvService,
  ) {}

  /**
   * Avisa cada administrador ativo sobre um relato já gravado.
   * Falha de consulta, render ou SMTP fica no log e não rejeita a promise.
   */
  async notify(report: BugReport, reporter: BugReportReporter): Promise<void> {
    try {
      const admins = await this.userRepository.findActiveByRole(Role.ADMIN);

      if (admins.length === 0) {
        this.logger.warn(
          `Nenhum administrador ativo para o relato #${report.bugReportId}`,
        );
        return;
      }

      const reportUrl = `${this.envService.get('FRONTEND_HOST')}/bug-reports`;
      const html = await renderFile(
        resolve('src', 'templates', 'bug-report-created.ejs'),
        {
          bugReportId: report.bugReportId,
          path: report.path,
          description: report.description,
          expectedBehavior: report.expectedBehavior,
          actualBehavior: report.actualBehavior,
          stepsToReproduce: report.stepsToReproduce,
          os: report.os,
          browser: report.browser,
          status: report.status,
          severity: report.severity,
          reporterName: reporter.name,
          reporterEmail: reporter.email,
          createdAt: report.createdAt,
          screenshots: report.screenshots,
          reportUrl,
        },
      );

      const subject = `Novo relato de bug #${report.bugReportId}`;
      const results = await Promise.allSettled(
        admins.map((admin) =>
          this.emailerService.sendEmail({
            to: admin.email,
            subject,
            html,
          }),
        ),
      );

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          this.logger.error(
            `Falha ao enviar o relato #${report.bugReportId} para ${admins[index].email}`,
            result.reason,
          );
        }
      });
    } catch (error) {
      this.logger.error(
        `Falha ao preparar a notificação do relato #${report.bugReportId}`,
        error,
      );
    }
  }
}
