import { Module } from '@nestjs/common';
import { InstitutionService } from './institution.service';
import {
  InstitutionsRepository,
  PrismaInstitutionsRepository,
} from '../../repositories/institutions-repository';
import { InstitutionController } from './institution.controller';

@Module({
  controllers: [InstitutionController],
  providers: [
    InstitutionService,
    {
      provide: InstitutionsRepository,
      useClass: PrismaInstitutionsRepository,
    },
  ],
})
export class InstitutionModule {}
