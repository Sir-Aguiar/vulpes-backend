import { Module } from '@nestjs/common';
import { StorageModule } from '../../infra/storage/storage.module';
import { UserModule } from '../user/user.module';
import { ProfessorPermissionController } from './professor-permission.controller';
import { ProfessorPermissionService } from './professor-permission.service';
import { PrismaProfessorPermissionRepository } from './repositories/prisma-professor-permission.repository';
import { ProfessorPermissionRepository } from './repositories/professor-permission.repository';

@Module({
  imports: [StorageModule, UserModule],
  controllers: [ProfessorPermissionController],
  providers: [
    ProfessorPermissionService,
    {
      provide: ProfessorPermissionRepository,
      useClass: PrismaProfessorPermissionRepository,
    },
  ],
  exports: [ProfessorPermissionService, ProfessorPermissionRepository],
})
export class ProfessorPermissionModule {}
