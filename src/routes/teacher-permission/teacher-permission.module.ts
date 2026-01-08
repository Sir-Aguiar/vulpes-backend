import { Module } from '@nestjs/common';
import { TeacherPermissionService } from './teacher-permission.service';
import { TeacherPermissionController } from './teacher-permission.controller';
import {
  PrismaTeacherPermissionRepository,
  TeacherPermissionRepository,
} from '../../repositories/teacher-permission-repository';
import { StorageModule } from '../../modules/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [TeacherPermissionController],
  providers: [
    TeacherPermissionService,
    {
      provide: TeacherPermissionRepository,
      useClass: PrismaTeacherPermissionRepository,
    },
  ],
})
export class TeacherPermissionModule {}
