import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import {
  PrismaTaskRepository,
  TaskRepository,
} from '../../repositories/task-repository';

@Module({
  controllers: [TaskController],
  providers: [
    TaskService,
    {
      provide: TaskRepository,
      useClass: PrismaTaskRepository,
    },
  ],
})
export class TaskModule {}
