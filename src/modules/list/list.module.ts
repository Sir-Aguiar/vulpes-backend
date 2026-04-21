import { Module, forwardRef } from '@nestjs/common';
import { ClassStudentModule } from '../class-student/class-student.module';
import { ClassTaskListModule } from '../class-task-list/class-task-list.module';
import { ClassTaskModule } from '../class-task/class-task.module';
import { ClassModule } from '../class/class.module';
import { TaskModule } from '../task/task.module';
import { ListController } from './list.controller';
import { ListService } from './list.service';
import { ListRepository } from './repositories/list.repository';
import { PrismaListRepository } from './repositories/prisma-list.repository';

@Module({
  imports: [
    ClassModule,
    ClassStudentModule,
    forwardRef(() => ClassTaskModule),
    forwardRef(() => ClassTaskListModule),
    forwardRef(() => TaskModule),
  ],
  controllers: [ListController],
  providers: [
    ListService,
    {
      provide: ListRepository,
      useClass: PrismaListRepository,
    },
  ],
  exports: [ListService, ListRepository],
})
export class ListModule {}
