import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { mockRepository } from '../../../test/helpers/mocks';
import { UserRepository } from '../user/repositories/user.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: ReturnType<typeof mockRepository<UserRepository>>;
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    userRepository = mockRepository<UserRepository>([
      'create',
      'findByEmail',
      'findById',
      'updateRole',
    ]);
    jwtService = { sign: jest.fn().mockReturnValue('signed-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('signup', () => {
    it('cria usuário e retorna access_token', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      const created = {
        userId: 'u-1',
        email: 'a@b.com',
        name: 'A',
        role: Role.STUDENT,
        institutionId: null,
        password: 'hashed',
      };
      userRepository.create.mockResolvedValue(created);

      const result = await service.signup({
        name: 'A',
        email: 'a@b.com',
        password: 'plain',
      });

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'a@b.com',
          name: 'A',
          role: Role.STUDENT,
          password: expect.not.stringMatching('plain'),
        }),
      );
      expect(result.access_token).toBe('signed-token');
      expect(result.user).toEqual({
        userId: 'u-1',
        email: 'a@b.com',
        name: 'A',
        role: Role.STUDENT,
        institutionId: null,
      });
    });

    it('lança ConflictException quando email já existe', async () => {
      userRepository.findByEmail.mockResolvedValue({ userId: 'u-existing' });

      await expect(
        service.signup({ name: 'A', email: 'a@b.com', password: 'x' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('rejeita credenciais inválidas (usuário não encontrado)', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'a@b.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejeita credenciais inválidas (senha errada)', async () => {
      const hashed = await bcrypt.hash('senha-correta', 10);
      userRepository.findByEmail.mockResolvedValue({
        userId: 'u-1',
        email: 'a@b.com',
        name: 'A',
        password: hashed,
        role: Role.STUDENT,
        institutionId: null,
      });

      await expect(
        service.login({ email: 'a@b.com', password: 'errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('autentica com credenciais válidas', async () => {
      const hashed = await bcrypt.hash('senha-correta', 10);
      userRepository.findByEmail.mockResolvedValue({
        userId: 'u-1',
        email: 'a@b.com',
        name: 'A',
        password: hashed,
        role: Role.STUDENT,
        institutionId: null,
      });

      const result = await service.login({
        email: 'a@b.com',
        password: 'senha-correta',
      });

      expect(result.access_token).toBe('signed-token');
      expect(result.user.userId).toBe('u-1');
    });
  });
});
