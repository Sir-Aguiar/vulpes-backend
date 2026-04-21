import { Module, forwardRef } from '@nestjs/common';
import { ClassStudentModule } from '../class-student/class-student.module';
import { ClassTaskModule } from '../class-task/class-task.module';
import { ListModule } from '../list/list.module';
import { ClassTaskListController } from './class-task-list.controller';
import { ClassTaskListService } from './class-task-list.service';
import { ClassTaskListRepository } from './repositories/class-task-list.repository';
import { PrismaClassTaskListRepository } from './repositories/prisma-class-task-list.repository';

@Module({
  imports: [
    forwardRef(() => ListModule),
    forwardRef(() => ClassTaskModule),
    ClassStudentModule,
  ],
  controllers: [ClassTaskListController],
  providers: [
    ClassTaskListService,
    {
      provide: ClassTaskListRepository,
      useClass: PrismaClassTaskListRepository,
    },
  ],
  exports: [ClassTaskListService, ClassTaskListRepository],
})
export class ClassTaskListModule {}
