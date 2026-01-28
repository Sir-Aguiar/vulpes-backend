import { ICreateUserDTO } from '../dtos/User';
import { User } from '@prisma/client';
import { prisma } from '../database/prismaClient';

export abstract class UserRepository {
  abstract create(data: ICreateUserDTO): Promise<User>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(userId: string): Promise<User | null>;
}

export class PrismaUserRepository implements UserRepository {
  async create(data: ICreateUserDTO): Promise<User> {
    return await prisma.user.create({
      data,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(userId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { userId },
    });
  }
}
