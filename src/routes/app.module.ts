import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskModule } from './task/task.module';
import { TeacherPermissionModule } from './teacher-permission/teacher-permission.module';
import { StorageModule } from '../modules/storage/storage.module';

@Module({
  imports: [StorageModule, TaskModule, TeacherPermissionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
