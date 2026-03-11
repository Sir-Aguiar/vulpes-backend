import { Module } from '@nestjs/common';
import { ListController } from './list.controller';
import { ListService } from './list.service';
import {
  PrismaListRepository,
  ListRepository,
} from '../../repositories/list-repository';
import {
  PrismaClassRepository,
  ClassRepository,
} from '../../repositories/class-repository';
import {
  PrismaClassStudentRepository,
  ClassStudentRepository,
} from '../../repositories/class-student-repository';
import {
  PrismaClassTaskRepository,
  ClassTaskRepository,
} from '../../repositories/class-task-repository';
import {
  PrismaClassTaskListRepository,
  TaskListRepository,
} from '../../repositories/class-task-list-repository';
import {
  PrismaTaskRepository,
  TaskRepository,
} from '../../repositories/task-repository';

@Module({
  controllers: [ListController],
  providers: [
    ListService,
    {
      provide: ListRepository,
      useClass: PrismaListRepository,
    },
    {
      provide: ClassRepository,
      useClass: PrismaClassRepository,
    },
    {
      provide: ClassStudentRepository,
      useClass: PrismaClassStudentRepository,
    },
    {
      provide: ClassTaskRepository,
      useClass: PrismaClassTaskRepository,
    },
    {
      provide: TaskListRepository,
      useClass: PrismaClassTaskListRepository,
    },
    {
      provide: TaskRepository,
      useClass: PrismaTaskRepository,
    },
  ],
  exports: [ListService, ListRepository],
})
export class ListModule {}
