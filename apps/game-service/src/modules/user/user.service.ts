import { ConflictException, Injectable } from '@nestjs/common';
import {
  GameUser,
  UserAlreadyExistsError,
  UserRepository,
} from './repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly users: UserRepository) {}

  async create(userId: string): Promise<GameUser> {
    try {
      return await this.users.create(userId);
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        throw new ConflictException('Usuário já possui documento de jogo');
      }

      throw error;
    }
  }
}
