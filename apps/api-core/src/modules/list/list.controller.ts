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
import { CreateListDto } from './dto/create-list.dto';
import { GetListsQueryDto } from './dto/get-lists.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ListService } from './list.service';

@ApiTags('list')
@ApiBearerAuth('bearer')
@Controller('list')
export class ListController {
  constructor(private readonly listService: ListService) {}

  @Post()
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Cria uma lista de exercícios em uma turma',
    description:
      'Se `taskIds` for informado, as tarefas são vinculadas à turma ' +
      '(se ainda não estiverem) e à lista em uma só operação.',
  })
  create(@Body() body: CreateListDto, @CurrentUser() user: AuthUser) {
    return this.listService.create(body, user);
  }

  @Get('class/:classId')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Lista todas as listas de uma turma' })
  async getByClassId(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query() query: GetListsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const { lists, total } = await this.listService.getByClassId(
      classId,
      query,
      user,
    );
    return paginate(lists, total, query);
  }

  @Get(':id')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Obtém uma lista por UUID' })
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.listService.getById(id, user);
  }

  @Get(':listId/:taskId')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Obtém uma tarefa específica dentro de uma lista',
  })
  getByIdAndTaskId(
    @Param('listId', ParseUUIDPipe) listId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.listService.getByIdAndTaskId(listId, taskId, user);
  }

  @Put(':id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Atualiza metadados da lista' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateListDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.listService.update(id, body, user);
  }

  @Delete(':id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Exclui uma lista' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.listService.delete(id, user);
  }
}
