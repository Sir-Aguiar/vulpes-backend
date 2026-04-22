import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { paginate } from '../../common/pagination/pagination.types';
import type { AuthUser } from '../../common/types/auth-user.type';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetLinkableTasksQueryDto } from './dto/get-linkable-tasks.dto';
import { GetTasksQueryDto } from './dto/get-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';
import { serializeTask, serializeTaskOrNull } from './task.serializer';

@ApiTags('task')
@ApiBearerAuth('bearer')
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Cria uma tarefa (problema de programação)',
    description:
      'Se `classIds` for informado, a tarefa é automaticamente vinculada às ' +
      'turmas das quais o usuário é dono (outras são ignoradas).',
  })
  create(@Body() body: CreateTaskDto, @CurrentUser() user: AuthUser) {
    return this.taskService.create(body, user);
  }

  @Get()
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Lista tarefas com filtros de visibilidade por role',
    description:
      'STUDENT: apenas tarefas públicas e visíveis. PROFESSOR: tarefas ' +
      'próprias + públicas visíveis. ADMIN: todas.',
  })
  async getAll(
    @Query() query: GetTasksQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const finalQuery: GetTasksQueryDto = { ...query };
    if (user.role === Role.STUDENT) {
      finalQuery.isPublic = true;
      finalQuery.isVisible = true;
    } else if (user.role === Role.PROFESSOR) {
      finalQuery.creatorId = user.userId;
      finalQuery.includePublicVisible = true;
    }

    const { tasks, total } = await this.taskService.getAll(finalQuery);
    return paginate(tasks.map(serializeTask), total, finalQuery);
  }

  @Get('/linkable-to-class')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Tarefas que podem ser vinculadas a uma turma (paginado)',
    description:
      'Retorna tarefas do criador + tarefas públicas e visíveis, excluindo ' +
      'as já vinculadas à turma. Suporta busca por título (`search`, ' +
      'case-insensitive) e ordenação por data de criação ' +
      '(`order=asc|desc`, default `desc`). Paginação padrão: 20/página.',
  })
  async getLinkableToClass(
    @Query() query: GetLinkableTasksQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const { tasks, total } = await this.taskService.getLinkableToClass(
      query,
      user,
    );
    return paginate(tasks, total, query);
  }

  @Get(':id')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Obtém uma tarefa por UUID com seus testes' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    const task = await this.taskService.getById(id);
    if (!task) return null;
    return { ...serializeTaskOrNull(task), classTasks: task.classTasks };
  }

  @Put(':id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Atualiza uma tarefa',
    description: 'Apenas o criador da tarefa ou um ADMIN pode atualizar.',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    const updated = await this.taskService.update(id, body, user);
    return serializeTask(updated);
  }

  @Delete(':id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Exclui uma tarefa (soft delete se houver submissões)',
    description:
      'Se a tarefa já tem submissões, é marcada como excluída (soft delete) ' +
      'para preservar histórico. Caso contrário, é removida fisicamente.',
  })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.taskService.delete(id, user);
  }
}
