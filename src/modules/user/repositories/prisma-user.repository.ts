import { Injectable } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserRepository } from './user.repository';
import { ApplicationError } from '../../../common/errors/application.error';

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

  async deactivate(userId: string): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { userId },
        data: {
          desativado: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ApplicationError(404, 'Usuário não encontrado', error);
        }
        throw new ApplicationError(400, 'Erro ao atualizar usuário', error);
      }
      throw new ApplicationError(
        500,
        'Erro inesperado ao desativar usuário',
        error,
      );
    }
  }
}
