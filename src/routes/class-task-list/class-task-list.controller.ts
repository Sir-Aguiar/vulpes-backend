import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ClassTaskListService } from './class-task-list.service';
import { ZodValidationPipe } from '../../pipes/Zod.pipe';
import * as ClassTaskListDTO from '../../dtos/ClassTaskList';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('class-task-list')
export class ClassTaskListController {
  constructor(private readonly classTaskListService: ClassTaskListService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async createClassTaskList(
    @Body(new ZodValidationPipe(ClassTaskListDTO.CreateClassTaskListSchema))
    body: ClassTaskListDTO.ICreateClassTaskListDTO,
    @CurrentUser() user: any,
  ) {
    return this.classTaskListService.create(body, user.userId, user.role);
  }

  @Get('task/:listId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  async getTasksByListId(
    @Param('listId') listId: string,
    @Query(new ZodValidationPipe(ClassTaskListDTO.GetClassTaskListsQuerySchema))
    query: ClassTaskListDTO.IGetClassTaskListsQuery,
    @CurrentUser() user: any,
  ) {
    const result = await this.classTaskListService.getTasksByListId(
      listId,
      query,
      user.userId,
      user.role,
    );

    return {
      tasks: result.tasks,
      total: result.total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(result.total / query.limit),
    };
  }

  @Delete(':classId/:taskId/:listId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async deleteClassTaskList(
    @Param('classId') classId: string,
    @Param('taskId') taskId: string,
    @Param('listId') listId: string,
    @CurrentUser() user: any,
  ) {
    return this.classTaskListService.delete(
      classId,
      taskId,
      listId,
      user.userId,
      user.role,
    );
  }
}
