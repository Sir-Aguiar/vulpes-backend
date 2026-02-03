import { Module } from '@nestjs/common';
import { ProfessorPermissionService } from './professor-permission.service';
import { ProfessorPermissionController } from './professor-permission.controller';
import {
  PrismaProfessorPermissionRepository,
  ProfessorPermissionRepository,
} from '../../repositories/professor-permission-repository';
import {
  PrismaUserRepository,
  UserRepository,
} from '../../repositories/user-repository';
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
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
})
export class ProfessorPermissionModule {}
