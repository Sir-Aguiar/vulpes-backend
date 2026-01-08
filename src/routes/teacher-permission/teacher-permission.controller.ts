import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { TeacherPermissionService } from './teacher-permission.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateTeacherPermissionSchema } from '../../dtos/TeacherPermission';
import { StorageService } from '../../modules/storage/storage.service';

@Controller('teacher-permission-request')
export class TeacherPermissionController {
  constructor(
    private readonly service: TeacherPermissionService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('document'))
  async create(
    @Body() body: any,
    @UploadedFile() document: Express.Multer.File,
  ) {
    const BodySchema = CreateTeacherPermissionSchema.omit({
      requestFileUrl: true,
    });
    const validatedBody = BodySchema.parse(body);

    const { url } = await this.storageService.uploadFile(document);

    const validatedData = CreateTeacherPermissionSchema.parse({
      ...validatedBody,
      requestFileUrl: url,
    });

    return this.service.create(validatedData);
  }
}
