import { Injectable } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { GetUsersQueryDto, UserListItem } from '../dto/get-users.dto';
import { UserRepository } from './user.repository';

const USER_LIST_SELECT = {
  userId: true,
  name: true,
  email: true,
  createdAt: true,
  desativado: true,
  role: true,
} satisfies Prisma.UserSelect;

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

  async findMany(
    query: GetUsersQueryDto,
  ): Promise<{ users: UserListItem[]; total: number }> {
    const { page, limit, search, order } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: USER_LIST_SELECT,
        orderBy: { createdAt: order },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
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

  deactivate(userId: string): Promise<User> {
    return this.setDesativado(userId, true);
  }

  setDesativado(userId: string, desativado: boolean): Promise<User> {
    return this.prisma.user.update({
      where: { userId },
      data: { desativado },
    });
  }
}
