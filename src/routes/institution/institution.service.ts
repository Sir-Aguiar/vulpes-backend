import { Injectable } from '@nestjs/common';
import { InstitutionsRepository } from '../../repositories/institutions-repository';

@Injectable()
export class InstitutionService {
  constructor(
    private readonly institutionsRepository: InstitutionsRepository,
  ) {}

  async getAll() {
    return await this.institutionsRepository.getAll();
  }
}
