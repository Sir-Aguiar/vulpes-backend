import { Body, Controller, Get, Post, Query, UsePipes } from '@nestjs/common';
import { TaskService } from './task.service';
import { ZodValidationPipe } from '../../pipes/Zod.pipe';
import * as Task from '../../dtos/Task';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(Task.CreateTaskSchema))
  async postTask(@Body() body: Task.ICreateTaskDTO) {
    return this.taskService.create(body);
  }

  @Get()
  async getTaskById(@Query('id') id: string) {
    const task = await this.taskService.getById(id);

    const formattedTestCases = task.taskTests.map((testCase) => ({
      ...testCase,
      input: Array.isArray(testCase.input)
        ? testCase.input.map((value: string) => JSON.parse(value))
        : JSON.parse(testCase.input),
    }));

    const formattedTask = {
      ...task,
      taskTests: formattedTestCases,
    };

    return formattedTask;
  }
}
