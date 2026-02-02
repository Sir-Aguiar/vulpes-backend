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
  ],
  exports: [ListService, ListRepository],
})
export class ListModule {}
