import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import {
  buildAdmin,
  buildAuthUser,
  buildStudent,
  mockRepository,
} from '../../../test/helpers/mocks';
import { ClassService } from './class.service';
import { ClassRepository } from './repositories/class.repository';

describe('ClassService', () => {
  let service: ClassService;
  let repository: ReturnType<typeof mockRepository<ClassRepository>>;

  beforeEach(async () => {
    repository = mockRepository<ClassRepository>([
      'create',
      'getById',
      'getByCode',
      'getAll',
      'getClassesByStudentId',
      'update',
      'delete',
      'generateUniqueCode',
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassService,
        { provide: ClassRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(ClassService);
  });

  describe('create', () => {
    it('cria turma com código único e professor logado', async () => {
      const professor = buildAuthUser({ role: Role.PROFESSOR });
      repository.generateUniqueCode.mockResolvedValue(1234);
      repository.create.mockResolvedValue({ classId: 'class-1' });

      const result = await service.create({ name: 'Turma A' }, professor);

      expect(repository.generateUniqueCode).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Turma A',
        professorId: professor.userId,
        code: 1234,
      });
      expect(result).toEqual({ classId: 'class-1' });
    });
  });

  describe('getById', () => {
    it('lança NotFoundException quando turma não existe', async () => {
      repository.getById.mockResolvedValue(null);
      await expect(service.getById('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('retorna a turma quando encontrada', async () => {
      const klass = { classId: 'class-1' };
      repository.getById.mockResolvedValue(klass);
      await expect(service.getById('class-1')).resolves.toEqual(klass);
    });
  });

  describe('getMyClasses', () => {
    it('retorna turmas do professor por filtro', async () => {
      const professor = buildAuthUser({ userId: 'p-1', role: Role.PROFESSOR });
      repository.getAll.mockResolvedValue({ classes: [], total: 0 });

      await service.getMyClasses(professor);

      expect(repository.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: 100,
        professorId: 'p-1',
      });
    });

    it('retorna turmas do estudante via repositório', async () => {
      const student = buildStudent({ userId: 's-1' });
      repository.getClassesByStudentId.mockResolvedValue([{ classId: 'c1' }]);

      const result = await service.getMyClasses(student);

      expect(repository.getClassesByStudentId).toHaveBeenCalledWith('s-1');
      expect(result).toEqual({ classes: [{ classId: 'c1' }], total: 1 });
    });
  });

  describe('update', () => {
    it('permite que o admin atualize qualquer turma', async () => {
      const admin = buildAdmin();
      repository.getById.mockResolvedValue({
        classId: 'c1',
        professorId: 'other',
      });
      repository.update.mockResolvedValue({ classId: 'c1', name: 'novo' });

      await service.update('c1', { name: 'novo' }, admin);

      expect(repository.update).toHaveBeenCalledWith('c1', { name: 'novo' });
    });

    it('rejeita quando o usuário não é dono nem admin', async () => {
      const someone = buildAuthUser({
        userId: 'u-1',
        role: Role.PROFESSOR,
      });
      repository.getById.mockResolvedValue({
        classId: 'c1',
        professorId: 'p-other',
      });

      await expect(
        service.update('c1', { name: 'x' }, someone),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});
