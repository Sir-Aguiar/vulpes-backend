import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskModule } from './task/task.module';
import { ProfessorPermissionModule } from './teacher-permission/professor-permission.module';
import { StorageModule } from '../modules/storage/storage.module';
import { SubmissionModule } from './submission/submission.module';

@Module({
  imports: [
    StorageModule,
    TaskModule,
    ProfessorPermissionModule,
    SubmissionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
