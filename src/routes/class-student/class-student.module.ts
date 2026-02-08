import { Module } from '@nestjs/common';
import { ClassStudentController } from './class-student.controller';
import { ClassStudentService } from './class-student.service';
import {
  PrismaClassStudentRepository,
  ClassStudentRepository,
} from '../../repositories/class-student-repository';
import {
  PrismaClassRepository,
  ClassRepository,
} from '../../repositories/class-repository';

@Module({
  controllers: [ClassStudentController],
  providers: [
    ClassStudentService,
    {
      provide: ClassStudentRepository,
      useClass: PrismaClassStudentRepository,
    },
    {
      provide: ClassRepository,
      useClass: PrismaClassRepository,
    },
  ],
  exports: [ClassStudentService, ClassStudentRepository],
})
export class ClassStudentModule {}
