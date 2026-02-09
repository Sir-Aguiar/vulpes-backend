import { Institution } from '@prisma/client';
import { prisma } from '../database/prismaClient';

export abstract class InstitutionsRepository {
  abstract getAll(): Promise<Institution[]>;
}

export class PrismaInstitutionsRepository extends InstitutionsRepository {
  async getAll(): Promise<Institution[]> {
    const institutions = await prisma.institution.findMany();
    return institutions;
  }
}
