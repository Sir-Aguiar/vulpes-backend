import { Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({ data });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { userId } });
  }

  updateRole(userId: string, role: Role): Promise<User> {
    return this.prisma.user.update({
      where: { userId },
      data: { role },
    });
  }

  updateName(userId: string, name: string): Promise<User> {
    return this.prisma.user.update({
      where: { userId },
      data: { name },
    });
  }

  updateEmail(userId: string, email: string): Promise<User> {
    return this.prisma.user.update({
      where: { userId },
      data: { email },
    });
  }

  updatePassword(userId: string, password: string): Promise<User> {
    return this.prisma.user.update({
      where: { userId },
      data: { password },
    });
  }
}
