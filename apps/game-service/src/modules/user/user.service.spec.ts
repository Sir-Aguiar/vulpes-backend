import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  UserAlreadyExistsError,
  UserRepository,
} from './repositories/user.repository';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let repository: { create: jest.Mock };

  beforeEach(async () => {
    repository = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(UserService);
  });

  const userId = '6f1b1c3e-8a2d-4b7e-9c11-2d4e6a8b0c13';

  it('cria o documento do usuário', async () => {
    const created = { userId, xp: 0, level: 1 };
    repository.create.mockResolvedValue(created);

    await expect(service.create(userId)).resolves.toEqual(created);
    expect(repository.create).toHaveBeenCalledWith(userId);
  });

  it('responde conflito quando o documento já existe', async () => {
    repository.create.mockRejectedValue(new UserAlreadyExistsError(userId));

    await expect(service.create(userId)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
