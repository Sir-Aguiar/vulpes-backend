import { Module } from '@nestjs/common';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';
import {
  PrismaClassRepository,
  ClassRepository,
} from '../../repositories/class-repository';
import {
  PrismaUserRepository,
  UserRepository,
} from '../../repositories/user-repository';

@Module({
  controllers: [ClassController],
  providers: [
    ClassService,
    {
      provide: ClassRepository,
      useClass: PrismaClassRepository,
    },
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [ClassService, ClassRepository],
})
export class ClassModule {}
