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
