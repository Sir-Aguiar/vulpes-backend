import { Module } from '@nestjs/common';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { UserRepository } from './repositories/user.repository';

@Module({
  providers: [
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UserRepository],
})
export class UserModule {}
