import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ClassService } from './class.service';
import { ZodValidationPipe } from '../../pipes/Zod.pipe';
import * as ClassDTO from '../../dtos/Class';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('class')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async createClass(
    @Body(new ZodValidationPipe(ClassDTO.CreateClassSchema))
    body: ClassDTO.ICreateClassDTO,
    @CurrentUser() user: any,
  ) {
    return this.classService.create(body, user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async getAllClasses(
    @Query(new ZodValidationPipe(ClassDTO.GetClassesQuerySchema))
    query: ClassDTO.IGetClassesQuery,
  ) {
    const result = await this.classService.getAll(query);
    return {
      classes: result.classes,
      total: result.total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(result.total / query.limit),
    };
  }

  @Get('my-classes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  async getMyClasses(@CurrentUser() user: any) {
    return this.classService.getMyClasses(user.userId, user.role);
  }

  @Get('code/:code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  async getClassByCode(@Param('code') code: string) {
    return this.classService.getByCode(parseInt(code, 10));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  async getClassById(@Param('id') id: string) {
    return this.classService.getById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async updateClass(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ClassDTO.UpdateClassSchema))
    body: ClassDTO.IUpdateClassDTO,
    @CurrentUser() user: any,
  ) {
    return this.classService.update(id, body, user.userId, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async deleteClass(@Param('id') id: string, @CurrentUser() user: any) {
    return this.classService.delete(id, user.userId, user.role);
  }
}
