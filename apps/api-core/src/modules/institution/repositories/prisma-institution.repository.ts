import { Injectable } from '@nestjs/common';
import { Institution } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { InstitutionRepository } from './institution.repository';

@Injectable()
export class PrismaInstitutionRepository implements InstitutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  getAll(): Promise<Institution[]> {
    return this.prisma.institution.findMany({ orderBy: { name: 'asc' } });
  }
}
