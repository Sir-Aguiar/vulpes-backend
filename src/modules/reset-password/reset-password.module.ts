import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EnvService } from '../../config/env.service';
import { EmailerModule } from '../../infra/emailer/emailer.module';
import { UserModule } from '../user/user.module';
import { PrismaResetPasswordRepository } from './repositories/prisma-reset-password.repository';
import { ResetPasswordRepository } from './repositories/reset-password.repository';
import { ResetPasswordController } from './reset-password.controller';
import { ResetPasswordService } from './reset-password.service';

@Module({
  imports: [
    UserModule,
    EmailerModule,
    JwtModule.registerAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        secret: env.get('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [ResetPasswordController],
  providers: [
    {
      provide: ResetPasswordRepository,
      useClass: PrismaResetPasswordRepository,
    },
    ResetPasswordService,
  ],
})
export class ResetPasswordModule {}
