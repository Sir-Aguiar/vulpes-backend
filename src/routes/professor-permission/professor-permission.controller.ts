import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProfessorPermissionService } from './professor-permission.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateProfessorPermissionSchema } from '../../dtos/ProfessorPermission';
import { StorageService } from '../../modules/storage/storage.service';

@Controller('professor-permission-request')
export class ProfessorPermissionController {
  constructor(
    private readonly service: ProfessorPermissionService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('document'))
  async create(
    @Body() body: any,
    @UploadedFile() document: Express.Multer.File,
  ) {
    const BodySchema = CreateProfessorPermissionSchema.omit({
      requestFileUrl: true,
    });
    const validatedBody = BodySchema.parse(body);

    const { url } = await this.storageService.uploadFile(document);

    const validatedData = CreateProfessorPermissionSchema.parse({
      ...validatedBody,
      requestFileUrl: url,
    });

    return this.service.create(validatedData);
  }

  @Get(':id')
  async getById(@Body('id') id: string) {
    return await this.service.getById(Number(id));
  }
}
