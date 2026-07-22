import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../../common/types/auth-user.type';
import { ClassTaskListRepository } from '../class-task-list/repositories/class-task-list.repository';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { SendFeedbackDto } from './dto/send-feedback.dto';
import { SubmissionRepository } from './repositories/submission.repository';

@Injectable()
export class SubmissionService {
  constructor(
    private readonly submissionRepository: SubmissionRepository,
    private readonly classTaskListRepository: ClassTaskListRepository,
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

  sendFeedback(submissionId: string, { professorComments }: SendFeedbackDto) {
    return this.submissionRepository.update(submissionId, {
      professorComments,
    });
  }

  getFeedbacks(user: AuthUser, isWidget: boolean = false) {
    return this.submissionRepository.getFeedbacks(user.userId, isWidget);
  }
}
