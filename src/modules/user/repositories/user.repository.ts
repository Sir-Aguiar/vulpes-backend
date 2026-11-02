import { Prisma, Role, User } from '@prisma/client';
import { CreateUserDto } from '../dto/create-user.dto';
import { GetUsersQueryDto, UserListItem } from '../dto/get-users.dto';

export abstract class UserRepository {
  abstract create(data: CreateUserDto): Promise<User>;
  abstract findByEmail(
    email: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null>;
  abstract findById(userId: string): Promise<User | null>;
  abstract findMany(
    query: GetUsersQueryDto,
  ): Promise<{ users: UserListItem[]; total: number }>;
  abstract updateRole(
    userId: string,
    role: Role,
    tx?: Prisma.TransactionClient,
  ): Promise<User>;
  abstract updateName(userId: string, name: string): Promise<User>;
  abstract updateEmail(
    userId: string,
    email: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User>;
  abstract updatePassword(
    userId: string,
    hashedPassword: string,
  ): Promise<User>;
  abstract deactivate(userId: string): Promise<User>;
  abstract setDesativado(
    userId: string,
    desativado: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<User>;
}
