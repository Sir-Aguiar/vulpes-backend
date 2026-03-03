import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { ZodValidationPipe } from '../../pipes/Zod.pipe';
import * as Task from '../../dtos/Task';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @UsePipes()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async postTask(
    @Body(new ZodValidationPipe(Task.CreateTaskSchema))
    body: Task.ICreateTaskDTO,
    @CurrentUser() user: any,
  ) {
    return this.taskService.create({
      ...body,
      creatorId: user.userId as string,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  async getAllTasks(@Query() query: any, @CurrentUser() user: any) {
    const validatedQuery = Task.GetTasksQuerySchema.parse(query);
    if (user.role === 'STUDENT') {
      validatedQuery.isPublic = 'true';
      validatedQuery.isVisible = 'true';
    }

    if (user.role === 'PROFESSOR') {
      validatedQuery.creatorId = user.userId;
      validatedQuery.includePublicVisible = true;
    }

    const result = await this.taskService.getAll(validatedQuery);

    const formattedTasks = result.tasks.map((task: any) => ({
      ...task,
      taskTests: task.taskTests.map((testCase: any) => ({
        ...testCase,
        input: JSON.parse(testCase.input),
      })),
    }));

    return {
      tasks: formattedTasks,
      total: result.total,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      totalPages: Math.ceil(result.total / validatedQuery.limit),
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  async getTaskById(@Param('id') id: string) {
    const task = await this.taskService.getById(id);

    const formattedTestCases = task?.taskTests.map((testCase: any) => ({
      ...testCase,
      input: JSON.parse(testCase.input),
    }));

    if (task && formattedTestCases) {
      task.taskTests = formattedTestCases;
    }

    return task;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @UsePipes()
  async updateTask(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(Task.UpdateTaskSchema))
    body: Task.IUpdateTaskDTO,
    @CurrentUser() user: any,
  ) {
    const updatedTask = await this.taskService.update(
      id,
      body,
      user.userId,
      user.role,
    );

    const formattedTestCases = updatedTask?.taskTests.map((testCase: any) => ({
      ...testCase,
      input: JSON.parse(testCase.input),
    }));

    if (updatedTask && formattedTestCases) {
      updatedTask.taskTests = formattedTestCases;
    }

    return updatedTask;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async deleteTask(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.taskService.delete(id, user.userId, user.role);
  }
}
