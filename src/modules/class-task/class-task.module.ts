import { Module, forwardRef } from '@nestjs/common';
import { ClassStudentModule } from '../class-student/class-student.module';
import { ClassModule } from '../class/class.module';
import { TaskModule } from '../task/task.module';
import { ClassTaskController } from './class-task.controller';
import { ClassTaskService } from './class-task.service';
import { ClassTaskRepository } from './repositories/class-task.repository';
import { PrismaClassTaskRepository } from './repositories/prisma-class-task.repository';

@Module({
  imports: [ClassModule, ClassStudentModule, forwardRef(() => TaskModule)],
  controllers: [ClassTaskController],
  providers: [
    ClassTaskService,
    {
      provide: ClassTaskRepository,
      useClass: PrismaClassTaskRepository,
    },
  ],
  exports: [ClassTaskService, ClassTaskRepository],
})
export class ClassTaskModule {}
