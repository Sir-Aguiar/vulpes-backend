import {
  BadRequestException,
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import 'multer';
import { Roles } from '../../common/decorators/roles.decorator';
import { StorageService } from '../../infra/storage/storage.service';
import {
  createProfessorPermissionSchema,
  RespondProfessorPermissionDto,
} from './dto/create-professor-permission.dto';
import { ProfessorPermissionService } from './professor-permission.service';

@ApiTags('professor-permission-request')
@ApiBearerAuth('bearer')
@Controller('professor-permission-request')
export class ProfessorPermissionController {
  constructor(
    private readonly service: ProfessorPermissionService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lista todas as solicitações (ADMIN)' })
  getAll() {
    return this.service.getAll();
  }

  @Post()
  @Roles(Role.STUDENT)
  @UseInterceptors(FileInterceptor('document'))
  @ApiOperation({
    summary: 'Solicita promoção a professor com documento comprobatório',
    description:
      'Upload de um documento (até 5MB) que comprove o vínculo institucional. ' +
      'O arquivo é armazenado no storage e a URL é persistida na solicitação. ' +
      'A validação do corpo é feita manualmente após o upload porque ' +
      '`requestFileUrl` é injetada pelo servidor, não enviada pelo cliente.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'name',
        'personalEmail',
        'institutionalEmail',
        'institutionId',
        'document',
      ],
      properties: {
        name: { type: 'string' },
        personalEmail: { type: 'string', format: 'email' },
        institutionalEmail: { type: 'string', format: 'email' },
        institutionId: { type: 'number' },
        document: { type: 'string', format: 'binary' },
      },
    },
  })
  async create(
    @Body() body: Record<string, unknown>,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
    )
    document: Express.Multer.File,
  ) {
    if (!document) {
      throw new BadRequestException('Documento é obrigatório');
    }

    const { url } = await this.storageService.uploadFile(document);
    const validated = createProfessorPermissionSchema.parse({
      ...body,
      requestFileUrl: url,
    });

    return this.service.create(validated);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Detalhes de uma solicitação (ADMIN)' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Aprova ou rejeita uma solicitação (ADMIN)',
    description:
      'Ao aprovar (APPROVED), se existe um usuário com o `personalEmail` ' +
      'informado, ele é promovido a role PROFESSOR.',
  })
  respond(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RespondProfessorPermissionDto,
  ) {
    return this.service.respond(id, body);
  }
}
