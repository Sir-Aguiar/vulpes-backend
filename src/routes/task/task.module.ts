import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import {
  PrismaTaskRepository,
  TaskRepository,
} from '../../repositories/task-repository';
import {
  PrismaClassTaskRepository,
  ClassTaskRepository,
} from '../../repositories/class-task-repository';
import {
  PrismaClassRepository,
  ClassRepository,
} from '../../repositories/class-repository';

@Module({
  controllers: [TaskController],
  providers: [
    TaskService,
    {
      provide: TaskRepository,
      useClass: PrismaTaskRepository,
    },
    {
      provide: ClassTaskRepository,
      useClass: PrismaClassTaskRepository,
    },
    {
      provide: ClassRepository,
      useClass: PrismaClassRepository,
    },
  ],
})
export class TaskModule {}
