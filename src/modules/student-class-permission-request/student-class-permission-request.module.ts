import { Module } from '@nestjs/common';
import { ClassStudentModule } from '../class-student/class-student.module';
import { ClassModule } from '../class/class.module';
import { PrismaStudentClassPermissionRequestRepository } from './repositories/prisma-student-class-permission-request.repository';
import { StudentClassPermissionRequestRepository } from './repositories/student-class-permission-request.repository';
import { StudentClassPermissionRequestController } from './student-class-permission-request.controller';
import { StudentClassPermissionRequestService } from './student-class-permission-request.service';

@Module({
  imports: [ClassModule, ClassStudentModule],
  controllers: [StudentClassPermissionRequestController],
  providers: [
    StudentClassPermissionRequestService,
    {
      provide: StudentClassPermissionRequestRepository,
      useClass: PrismaStudentClassPermissionRequestRepository,
    },
  ],
  exports: [
    StudentClassPermissionRequestService,
    StudentClassPermissionRequestRepository,
  ],
})
export class StudentClassPermissionRequestModule {}
