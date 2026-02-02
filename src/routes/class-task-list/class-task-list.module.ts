import { Module } from '@nestjs/common';
import { ClassTaskListController } from './class-task-list.controller';
import { ClassTaskListService } from './class-task-list.service';
import {
  PrismaClassTaskListRepository,
  ClassTaskListRepository,
} from '../../repositories/class-task-list-repository';
import {
  PrismaListRepository,
  ListRepository,
} from '../../repositories/list-repository';
import {
  PrismaClassTaskRepository,
  ClassTaskRepository,
} from '../../repositories/class-task-repository';
import {
  PrismaClassStudentRepository,
  ClassStudentRepository,
} from '../../repositories/class-student-repository';

@Module({
  controllers: [ClassTaskListController],
  providers: [
    ClassTaskListService,
    {
      provide: ClassTaskListRepository,
      useClass: PrismaClassTaskListRepository,
    },
    {
      provide: ListRepository,
      useClass: PrismaListRepository,
    },
    {
      provide: ClassTaskRepository,
      useClass: PrismaClassTaskRepository,
    },
    {
      provide: ClassStudentRepository,
      useClass: PrismaClassStudentRepository,
    },
  ],
  exports: [ClassTaskListService],
})
export class ClassTaskListModule {}
