import { Module } from '@nestjs/common';
import { StudentClassPermissionRequestController } from './student-class-permission-request.controller';
import { StudentClassPermissionRequestService } from './student-class-permission-request.service';
import {
  PrismaStudentClassPermissionRequestRepository,
  StudentClassPermissionRequestRepository,
} from '../../repositories/student-class-permission-request-repository';
import {
  PrismaClassRepository,
  ClassRepository,
} from '../../repositories/class-repository';
import {
  PrismaClassStudentRepository,
  ClassStudentRepository,
} from '../../repositories/class-student-repository';

@Module({
  controllers: [StudentClassPermissionRequestController],
  providers: [
    StudentClassPermissionRequestService,
    {
      provide: StudentClassPermissionRequestRepository,
      useClass: PrismaStudentClassPermissionRequestRepository,
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
  exports: [StudentClassPermissionRequestService],
})
export class StudentClassPermissionRequestModule {}
