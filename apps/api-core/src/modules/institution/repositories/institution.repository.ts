import { Institution } from '@prisma/client';

export abstract class InstitutionRepository {
  abstract getAll(): Promise<Institution[]>;
}
