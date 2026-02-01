import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProfessorPermissionService } from './professor-permission.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateProfessorPermissionSchema } from '../../dtos/ProfessorPermission';
import { StorageService } from '../../modules/storage/storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('professor-permission-request')
export class ProfessorPermissionController {
  constructor(
    private readonly service: ProfessorPermissionService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getById(@Body('id') id: string) {
    return await this.service.getById(Number(id));
  }
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async respond(
    @Body('id') id: string,
    @Body() body: { requestStatus: 'APPROVED' | 'REJECTED' },
  ) {
    return await this.service.respond(Number(id), body);
  }
}
