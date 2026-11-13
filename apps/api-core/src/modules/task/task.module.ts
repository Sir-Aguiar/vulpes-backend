import { Module, forwardRef } from '@nestjs/common';
import { ClassTaskModule } from '../class-task/class-task.module';
import { ClassModule } from '../class/class.module';
import { PrismaTaskRepository } from './repositories/prisma-task.repository';
import { TaskRepository } from './repositories/task.repository';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
  imports: [ClassModule, forwardRef(() => ClassTaskModule)],
  controllers: [TaskController],
  providers: [
    TaskService,
    {
      provide: TaskRepository,
      useClass: PrismaTaskRepository,
    },
  ],
  exports: [TaskRepository, TaskService],
})
export class TaskModule {}
