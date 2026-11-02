import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ensureClassWriteAccess } from '../../common/authorization/authorization.helpers';
import { AuthUser } from '../../common/types/auth-user.type';
import { changedFields } from '../audit/audit-diff';
import { AuditAction } from '../audit/audit.types';
import { AuditService } from '../audit/audit.service';
import { ClassTaskListRepository } from '../class-task-list/repositories/class-task-list.repository';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { SendFeedbackDto } from './dto/send-feedback.dto';
import { SubmissionRepository } from './repositories/submission.repository';

@Injectable()
export class SubmissionService {
  constructor(
    private readonly submissionRepository: SubmissionRepository,
    private readonly classTaskListRepository: ClassTaskListRepository,
    private readonly audit: AuditService,
  ) {}

  async create(data: CreateSubmissionDto, user: AuthUser) {
    if (data.classTaskListId) {
      await this.ensureListSubmissionAllowed(data.classTaskListId, user.userId);
    }

    return this.submissionRepository.create({
      ...data,
      studentId: user.userId,
    });
  }

  private async ensureListSubmissionAllowed(
    classTaskListId: string,
    studentId: string,
  ) {
    const classTaskList =
      await this.classTaskListRepository.getById(classTaskListId);

    if (!classTaskList) {
      throw new NotFoundException('Tarefa na lista não encontrada');
    }

    const submissionLimit = classTaskList.list?.submissionLimit;
    if (submissionLimit == null) return;

    const submissionCount =
      await this.submissionRepository.countByStudentAndClassTaskListId(
        studentId,
        classTaskListId,
      );

    if (submissionCount >= submissionLimit) {
      throw new BadRequestException(
        `Limite de ${submissionLimit} envio(s) atingido para esta tarefa na lista`,
      );
    }
  }

  getByTaskId(taskId: string) {
    return this.submissionRepository.getByTaskId(taskId);
  }

  getByClassTaskId(classTaskId: string) {
    return this.submissionRepository.getByClassTaskId(classTaskId);
  }

  getByClassTaskListId(classTaskListId: string) {
    return this.submissionRepository.getByClassTaskListId(classTaskListId);
  }

  async sendFeedback(
    submissionId: string,
    { professorComments }: SendFeedbackDto,
    user: AuthUser,
  ) {
    const context =
      await this.submissionRepository.getFeedbackContext(submissionId);

    if (!context) {
      throw new NotFoundException('Submissão não encontrada');
    }

    ensureClassWriteAccess(
      user,
      context.professorId ?? '',
      'Você não tem permissão para enviar feedback nesta turma',
    );

    return this.audit.transaction(async (tx) => {
      const updated = await this.submissionRepository.update(
        submissionId,
        { professorComments },
        tx,
      );

      const diff = changedFields(
        { professorComments: context.professorComments },
        { professorComments },
      );
      if (diff) {
        await this.audit.record(
          {
            actor: user,
            action: AuditAction.submissionFeedbackUpdated,
            entityType: 'Submission',
            entityId: submissionId,
            diff,
          },
          tx,
        );
      }

      return updated;
    });
  }

  getFeedbacks(user: AuthUser, isWidget: boolean = false) {
    return this.submissionRepository.getFeedbacks(user.userId, isWidget);
  }
}
