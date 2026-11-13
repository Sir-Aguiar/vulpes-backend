import { Module } from '@nestjs/common';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';
import { PrismaClassRepository } from './repositories/prisma-class.repository';
import { ClassRepository } from './repositories/class.repository';

@Module({
  controllers: [ClassController],
  providers: [
    ClassService,
    {
      provide: ClassRepository,
      useClass: PrismaClassRepository,
    },
  ],
  exports: [ClassService, ClassRepository],
})
export class ClassModule {}
