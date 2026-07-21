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
import { serializeClassTask } from './class-task.serializer';
import { ClassTaskService } from './class-task.service';
import { CreateClassTaskDto } from './dto/create-class-task.dto';
import { GetClassTasksQueryDto } from './dto/get-class-tasks.dto';

@ApiTags('class-task')
@ApiBearerAuth('bearer')
@Controller('class-task')
export class ClassTaskController {
  constructor(private readonly classTaskService: ClassTaskService) {}

  @Post()
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Vincula uma tarefa a uma turma',
    description:
      'Professor só pode vincular tarefas que criou OU tarefas públicas e ' +
      'visíveis. ADMIN não tem essa restrição.',
  })
  create(@Body() body: CreateClassTaskDto, @CurrentUser() user: AuthUser) {
    return this.classTaskService.create(body, user);
  }

  @Get('class/:classId')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Lista tarefas vinculadas a uma turma' })
  async getByClassId(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query() query: GetClassTasksQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const { classTasks, total } = await this.classTaskService.getByClassId(
      classId,
      query,
      user,
    );
    return paginate(classTasks.map(serializeClassTask), total, query);
  }

  @Get('dashboard')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Dashboard de envios de uma tarefa em uma turma',
    description:
      'Retorna KPIs (taxa de entrega, taxa de acerto, alunos pendentes e ' +
      'feedbacks pendentes) e uma tabela com todos os alunos matriculados ' +
      'na turma, contendo status do envio (não enviou / enviou correto / ' +
      'enviou errado), quantidade de envios e data do último envio. ' +
      'Considera apenas submissions feitas diretamente para o classTask ' +
      '(ignora envios feitos via lista).',
  })
  getDashboardData(
    @CurrentUser() user: AuthUser,
    @Query('classId', ParseUUIDPipe) classId: string,
    @Query('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.classTaskService.getDashboardData(user, classId, taskId);
  }

  @Get('my-tasks')
  @Roles(Role.STUDENT)
  @ApiOperation({
    summary: 'Minhas tarefas (agrupadas por turma)',
    description:
      'Retorna tarefas visíveis vinculadas às turmas do aluno, agrupadas ' +
      'por turma. Exibe no máximo as 5 tarefas mais recentes de cada turma. ' +
      'Acesso às tarefas via `classTaskId`.',
  })
  getMyTasks(@CurrentUser() user: AuthUser) {
    return this.classTaskService.getMyTasks(user);
  }

  @Get(':classTaskId')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Obtém uma tarefa vinculada a uma turma pelo classTaskId',
  })
  getById(
    @Param('classTaskId', ParseUUIDPipe) classTaskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.classTaskService.getById(classTaskId, user);
  }

  @Delete(':classId/:taskId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Desvincula tarefa de uma turma' })
  delete(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.classTaskService.delete(classId, taskId, user);
  }
}
