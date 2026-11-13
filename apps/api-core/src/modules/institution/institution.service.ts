import { Injectable } from '@nestjs/common';
import { InstitutionRepository } from './repositories/institution.repository';

@Injectable()
export class InstitutionService {
  constructor(private readonly institutionRepository: InstitutionRepository) {}

  getAll() {
    return this.institutionRepository.getAll();
  }
}
