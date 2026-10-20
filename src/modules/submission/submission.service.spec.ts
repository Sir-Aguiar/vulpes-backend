import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import {
  buildAdmin,
  buildAuthUser,
  mockRepository,
} from '../../../test/helpers/mocks';
import { ClassTaskListRepository } from '../class-task-list/repositories/class-task-list.repository';
import { SubmissionRepository } from './repositories/submission.repository';
import { SubmissionService } from './submission.service';

describe('SubmissionService', () => {
  let service: SubmissionService;
  let repository: ReturnType<typeof mockRepository<SubmissionRepository>>;

  beforeEach(async () => {
    repository = mockRepository<SubmissionRepository>([
      'getFeedbackContext',
      'update',
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionService,
        { provide: SubmissionRepository, useValue: repository },
        { provide: ClassTaskListRepository, useValue: {} },
      ],
    }).compile();

    service = module.get(SubmissionService);
  });

  describe('sendFeedback', () => {
    const submissionId = 'submission-1';
    const body = { professorComments: 'Revise o caso de borda' };

    it('grava o comentário quando o professor é dono da turma', async () => {
      const professor = buildAuthUser({
        userId: 'prof-1',
        role: Role.PROFESSOR,
      });
      repository.getFeedbackContext.mockResolvedValue({
        professorId: 'prof-1',
      });
      repository.update.mockResolvedValue({ submissionId });

      await service.sendFeedback(submissionId, body, professor);

      expect(repository.update).toHaveBeenCalledWith(submissionId, {
        professorComments: body.professorComments,
      });
    });

    it('nega professor que não é dono da turma', async () => {
      const professor = buildAuthUser({
        userId: 'prof-2',
        role: Role.PROFESSOR,
      });
      repository.getFeedbackContext.mockResolvedValue({
        professorId: 'prof-1',
      });

      await expect(
        service.sendFeedback(submissionId, body, professor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('nega professor quando a submissão não está vinculada a uma turma', async () => {
      const professor = buildAuthUser({ role: Role.PROFESSOR });
      repository.getFeedbackContext.mockResolvedValue({ professorId: null });

      await expect(
        service.sendFeedback(submissionId, body, professor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('permite admin mesmo sem ser o dono da turma', async () => {
      repository.getFeedbackContext.mockResolvedValue({
        professorId: 'prof-1',
      });
      repository.update.mockResolvedValue({ submissionId });

      await service.sendFeedback(submissionId, body, buildAdmin());

      expect(repository.update).toHaveBeenCalledTimes(1);
    });

    it('lança NotFoundException quando a submissão não existe', async () => {
      repository.getFeedbackContext.mockResolvedValue(null);

      await expect(
        service.sendFeedback(submissionId, body, buildAuthUser()),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});
