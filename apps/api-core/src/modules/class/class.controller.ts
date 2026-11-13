import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { ClassService } from './class.service';
import { CreateClassDto } from './dto/create-class.dto';
import { GetClassesQueryDto } from './dto/get-classes.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@ApiTags('class')
@ApiBearerAuth('bearer')
@Controller('class')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Cria uma turma',
    description:
      'O usuário autenticado se torna o `professorId` da turma. Um código ' +
      'numérico único é gerado automaticamente para compartilhamento.',
  })
  create(@Body() body: CreateClassDto, @CurrentUser() user: AuthUser) {
    return this.classService.create(body, user);
  }

  @Get()
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Lista todas as turmas (paginado)' })
  async getAll(@Query() query: GetClassesQueryDto) {
    const { classes, total } = await this.classService.getAll(query);
    return paginate(classes, total, query);
  }

  @Get('my-classes')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Turmas do usuário autenticado',
    description:
      'Professores/admins recebem as turmas que lecionam; estudantes recebem ' +
      'as turmas em que estão matriculados.',
  })
  getMyClasses(@CurrentUser() user: AuthUser) {
    return this.classService.getMyClasses(user);
  }

  @Get('code/:code')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Busca turma pelo código de ingresso' })
  getByCode(@Param('code', ParseIntPipe) code: number) {
    return this.classService.getByCode(code);
  }

  @Get(':id')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Busca turma pelo UUID' })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.classService.getById(id);
  }

  @Put(':id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Atualiza uma turma',
    description: 'Apenas o professor dono da turma ou um ADMIN pode atualizar.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateClassDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.classService.update(id, body, user);
  }

  @Delete(':id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Exclui uma turma',
    description: 'Apenas o professor dono da turma ou um ADMIN pode excluir.',
  })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.classService.delete(id, user);
  }
}
