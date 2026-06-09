import { Module } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppController } from './app.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { StorageModule } from './infra/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { BugReportModule } from './modules/bug-report/bug-report.module';
import { ClassStudentModule } from './modules/class-student/class-student.module';
import { ClassTaskListModule } from './modules/class-task-list/class-task-list.module';
import { ClassTaskModule } from './modules/class-task/class-task.module';
import { ClassModule } from './modules/class/class.module';
import { InstitutionModule } from './modules/institution/institution.module';
import { ListModule } from './modules/list/list.module';
import { ProfessorPermissionModule } from './modules/professor-permission/professor-permission.module';
import { ResetPasswordModule } from './modules/reset-password/reset-password.module';
import { StudentClassPermissionRequestModule } from './modules/student-class-permission-request/student-class-permission-request.module';
import { SubmissionModule } from './modules/submission/submission.module';
import { TaskModule } from './modules/task/task.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    StorageModule,
    UserModule,
    AuthModule,
    BugReportModule,
    ClassModule,
    ClassStudentModule,
    ClassTaskModule,
    ClassTaskListModule,
    ListModule,
    TaskModule,
    SubmissionModule,
    InstitutionModule,
    ProfessorPermissionModule,
    ResetPasswordModule,
    StudentClassPermissionRequestModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
