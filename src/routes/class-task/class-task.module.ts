import { Module } from '@nestjs/common';
import { ClassTaskController } from './class-task.controller';
import { ClassTaskService } from './class-task.service';
import {
  PrismaClassTaskRepository,
  ClassTaskRepository,
} from '../../repositories/class-task-repository';
import {
  PrismaClassRepository,
  ClassRepository,
} from '../../repositories/class-repository';
import {
  PrismaTaskRepository,
  TaskRepository,
} from '../../repositories/task-repository';
import {
  PrismaClassStudentRepository,
  ClassStudentRepository,
} from '../../repositories/class-student-repository';

@Module({
  controllers: [ClassTaskController],
  providers: [
    ClassTaskService,
    {
      provide: ClassTaskRepository,
      useClass: PrismaClassTaskRepository,
    },
    {
      provide: ClassRepository,
      useClass: PrismaClassRepository,
    },
    {
      provide: TaskRepository,
      useClass: PrismaTaskRepository,
    },
    {
      provide: ClassStudentRepository,
      useClass: PrismaClassStudentRepository,
    },
  ],
  exports: [ClassTaskService, ClassTaskRepository],
})
export class ClassTaskModule {}
