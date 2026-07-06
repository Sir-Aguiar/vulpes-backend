import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { paginate } from '../../common/pagination/pagination.types';
import type { AuthUser } from '../../common/types/auth-user.type';
import { ClassTaskListService } from './class-task-list.service';
import { CreateClassTaskListDto } from './dto/create-class-task-list.dto';
import { GetClassTaskListsQueryDto } from './dto/get-class-task-lists.dto';

@ApiTags('class-task-list')
@ApiBearerAuth('bearer')
@Controller('class-task-list')
export class ClassTaskListController {
  constructor(private readonly classTaskListService: ClassTaskListService) {}

  @Post()
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Adiciona uma tarefa a uma lista',
    description:
      'A tarefa deve já estar vinculada à turma (`ClassTask`) antes de ser ' +
      'adicionada à lista. Tarefas não visíveis são rejeitadas.',
  })
  create(@Body() body: CreateClassTaskListDto, @CurrentUser() user: AuthUser) {
    return this.classTaskListService.create(body, user);
  }

  @Get('task/:listId')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Lista tarefas pertencentes a uma lista' })
  async getTasksByListId(
    @Param('listId', ParseUUIDPipe) listId: string,
    @Query() query: GetClassTaskListsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const { tasks, total } = await this.classTaskListService.getTasksByListId(
      listId,
      query,
      user,
    );
    return paginate(tasks, total, query);
  }

  @Delete(':classTaskListId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Remove tarefa de uma lista' })
  delete(
    @Param('classTaskListId', ParseUUIDPipe) classTaskListId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.classTaskListService.delete(classTaskListId, user);
  }
}
