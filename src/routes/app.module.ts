import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskModule } from './task/task.module';
import { TeacherPermissionModule } from './teacher-permission/teacher-permission.module';
import { StorageModule } from '../modules/storage/storage.module';
import { SubmissionModule } from './submission/submission.module';

@Module({
  imports: [
    StorageModule,
    TaskModule,
    TeacherPermissionModule,
    SubmissionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
