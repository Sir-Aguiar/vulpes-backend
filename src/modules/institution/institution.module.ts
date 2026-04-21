import { Module } from '@nestjs/common';
import { InstitutionController } from './institution.controller';
import { InstitutionService } from './institution.service';
import { InstitutionRepository } from './repositories/institution.repository';
import { PrismaInstitutionRepository } from './repositories/prisma-institution.repository';

@Module({
  controllers: [InstitutionController],
  providers: [
    InstitutionService,
    {
      provide: InstitutionRepository,
      useClass: PrismaInstitutionRepository,
    },
  ],
  exports: [InstitutionService, InstitutionRepository],
})
export class InstitutionModule {}
