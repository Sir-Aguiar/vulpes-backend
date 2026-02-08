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
import { ClassTaskService } from './class-task.service';
import { ZodValidationPipe } from '../../pipes/Zod.pipe';
import * as ClassTaskDTO from '../../dtos/ClassTask';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('class-task')
export class ClassTaskController {
  constructor(private readonly classTaskService: ClassTaskService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async createClassTask(
    @Body(new ZodValidationPipe(ClassTaskDTO.CreateClassTaskSchema))
    body: ClassTaskDTO.ICreateClassTaskDTO,
    @CurrentUser() user: any,
  ) {
    return this.classTaskService.create(body, user.userId, user.role);
  }

  @Get('class/:classId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  async getTasksByClassId(
    @Param('classId') classId: string,
    @Query(new ZodValidationPipe(ClassTaskDTO.GetClassTasksQuerySchema))
    query: ClassTaskDTO.IGetClassTasksQuery,
    @CurrentUser() user: any,
  ) {
    const result = await this.classTaskService.getByClassId(
      classId,
      query,
      user.userId,
      user.role,
    );
    return {
      classTasks: result.classTasks,
      total: result.total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(result.total / query.limit),
    };
  }

  @Delete(':classId/:taskId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async deleteClassTask(
    @Param('classId') classId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
  ) {
    return this.classTaskService.delete(
      classId,
      taskId,
      user.userId,
      user.role,
    );
  }
}
