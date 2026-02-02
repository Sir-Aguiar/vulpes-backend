import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskModule } from './task/task.module';
import { ProfessorPermissionModule } from './professor-permission/professor-permission.module';
import { StorageModule } from '../modules/storage/storage.module';
import { SubmissionModule } from './submission/submission.module';
import { AuthModule } from './auth/auth.module';
import { ClassModule } from './class/class.module';
import { ClassStudentModule } from './class-student/class-student.module';
import { StudentClassPermissionRequestModule } from './student-class-permission-request/student-class-permission-request.module';
import { ClassTaskModule } from './class-task/class-task.module';
import { ListModule } from './list/list.module';
import { ClassTaskListModule } from './class-task-list/class-task-list.module';

@Module({
  imports: [
    AuthModule,
    StorageModule,
    TaskModule,
    ProfessorPermissionModule,
    SubmissionModule,
    ClassModule,
    ClassStudentModule,
    StudentClassPermissionRequestModule,
    ClassTaskModule,
    ListModule,
    ClassTaskListModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
