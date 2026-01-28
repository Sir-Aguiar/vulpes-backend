import { Module } from '@nestjs/common';
import { ProfessorPermissionService } from './professor-permission.service';
import { ProfessorPermissionController } from './professor-permission.controller';
import {
  PrismaProfessorPermissionRepository,
  ProfessorPermissionRepository,
} from '../../repositories/professor-permission-repository';
import { StorageModule } from '../../modules/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ProfessorPermissionController],
  providers: [
    ProfessorPermissionService,
    {
      provide: ProfessorPermissionRepository,
      useClass: PrismaProfessorPermissionRepository,
    },
  ],
})
export class ProfessorPermissionModule {}
