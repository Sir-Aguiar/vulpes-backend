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
import { ListService } from './list.service';
import { ZodValidationPipe } from '../../pipes/Zod.pipe';
import * as ListDTO from '../../dtos/List';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('list')
export class ListController {
  constructor(private readonly listService: ListService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async createList(
    @Body(new ZodValidationPipe(ListDTO.CreateListSchema))
    body: ListDTO.ICreateListDTO,
    @CurrentUser() user: any,
  ) {
    return this.listService.create(body, user.userId, user.role);
  }

  @Get('class/:classId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  async getListsByClassId(
    @Param('classId') classId: string,
    @Query(new ZodValidationPipe(ListDTO.GetListsQuerySchema))
    query: ListDTO.IGetListsQuery,
    @CurrentUser() user: any,
  ) {
    const result = await this.listService.getByClassId(
      classId,
      query,
      user.userId,
      user.role,
    );
    return {
      lists: result.lists,
      total: result.total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(result.total / query.limit),
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  async getListById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.listService.getById(id, user.userId, user.role);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async updateList(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ListDTO.UpdateListSchema))
    body: ListDTO.IUpdateListDTO,
    @CurrentUser() user: any,
  ) {
    return this.listService.update(id, body, user.userId, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async deleteList(@Param('id') id: string, @CurrentUser() user: any) {
    return this.listService.delete(id, user.userId, user.role);
  }
}
