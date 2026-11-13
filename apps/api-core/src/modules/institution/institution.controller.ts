import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { InstitutionService } from './institution.service';

@ApiTags('institution')
@Controller('institution')
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Lista todas as instituições (público)',
    description:
      'Rota pública usada pela tela de cadastro e pelo formulário de ' +
      'solicitação de promoção a professor.',
  })
  getAll() {
    return this.institutionService.getAll();
  }
}
