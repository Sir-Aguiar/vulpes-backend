import { Role, User } from '@prisma/client';
import { CreateUserDto } from '../dto/create-user.dto';

export abstract class UserRepository {
  abstract create(data: CreateUserDto): Promise<User>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(userId: string): Promise<User | null>;
  abstract updateRole(userId: string, role: Role): Promise<User>;
  abstract updateName(userId: string, name: string): Promise<User>;
  abstract updateEmail(userId: string, email: string): Promise<User>;
  abstract updatePassword(
    userId: string,
    hashedPassword: string,
  ): Promise<User>;
}
