import { Module } from '@nestjs/common';
import { ClassModule } from '../class/class.module';
import { ClassStudentController } from './class-student.controller';
import { ClassStudentService } from './class-student.service';
import { ClassStudentRepository } from './repositories/class-student.repository';
import { PrismaClassStudentRepository } from './repositories/prisma-class-student.repository';

@Module({
  imports: [ClassModule],
  controllers: [ClassStudentController],
  providers: [
    ClassStudentService,
    {
      provide: ClassStudentRepository,
      useClass: PrismaClassStudentRepository,
    },
  ],
  exports: [ClassStudentService, ClassStudentRepository],
})
export class ClassStudentModule {}
