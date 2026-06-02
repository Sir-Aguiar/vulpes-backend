import { Module } from '@nestjs/common';
import { EmailerModule } from '../../infra/emailer/emailer.module';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { UserRepository } from './repositories/user.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtModule } from '@nestjs/jwt';
import { EnvService } from '../../config/env.service';

@Module({
  imports: [
    EmailerModule,
    JwtModule.registerAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        secret: env.get('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [UserController],
  providers: [
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    UserService,
  ],
  exports: [UserRepository],
})
export class UserModule {}
