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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { StorageService } from '../../infra/storage/storage.service';
import { CustomFileTypeValidator } from '../../common/validators/custom-file-type.validator';
import { BugReportService } from './bug-report.service';
import { createBugReportSchema } from './dto/create-bug-report.dto';
import { UpdateBugReportDto } from './dto/update-bug-report.dto';

const BUG_EVIDENCES_DIRECTORY = 'bug_evidences';
const MAX_SCREENSHOTS = 5;
const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024;

@ApiTags('bug-report')
@ApiBearerAuth('bearer')
@Controller('bug-report')
export class BugReportController {
  constructor(
    private readonly service: BugReportService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @UseInterceptors(FilesInterceptor('screenshots', MAX_SCREENSHOTS))
  @ApiOperation({
    summary: 'Reporta um bug',
    description:
      '`path` e `description` são obrigatórios; demais campos de texto, `os` ' +
      'e screenshots são opcionais. `status` inicia como OPEN e `severity` ' +
      'como LOW. Evidências vão para `bug_evidences` no bucket; no banco ' +
      'ficam apenas as URLs.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['path', 'description'],
      properties: {
        path: { type: 'string' },
        description: { type: 'string' },
        expectedBehavior: { type: 'string' },
        actualBehavior: { type: 'string' },
        stepsToReproduce: { type: 'string' },
        os: { type: 'string' },
        browser: { type: 'string' },
        screenshots: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthUser,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_SCREENSHOT_SIZE }),
          new CustomFileTypeValidator({
            allowedTypes: [
              'image/jpeg',
              'image/png',
              'image/webp',
              'image/gif',
            ],
          }),
        ],
        fileIsRequired: false,
      }),
    )
    screenshots?: Express.Multer.File[],
  ) {
    const screenshotUrls = await Promise.all(
      (screenshots ?? []).map(async (file) => {
        const { url } = await this.storageService.uploadFile(
          file,
          BUG_EVIDENCES_DIRECTORY,
        );
        return url;
      }),
    );

    const validated = createBugReportSchema.safeParse({
      ...body,
      screenshots: screenshotUrls,
    });

    if (!validated.success) {
      throw new BadRequestException(validated.error.issues);
    }

    return this.service.create(validated.data, user);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lista todos os reports de bug (ADMIN)' })
  getAll() {
    return this.service.getAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Detalhes de um report de bug (ADMIN)' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Atualiza status e/ou severity de um report (ADMIN)',
    description:
      'Permite gerenciar o ciclo de vida do bug (`OPEN`, `IN_PROGRESS`, ' +
      '`RESOLVED`, `CLOSED`) e a prioridade (`LOW`, `MEDIUM`, `HIGH`, ' +
      '`CRITICAL`).',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateBugReportDto,
  ) {
    return this.service.update(id, body);
  }
}
