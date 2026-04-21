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
import { ClassStudentService } from './class-student.service';
import { CreateClassStudentDto } from './dto/create-class-student.dto';
import { GetClassStudentsQueryDto } from './dto/get-class-students.dto';

@ApiTags('class-student')
@ApiBearerAuth('bearer')
@Controller('class-student')
export class ClassStudentController {
  constructor(private readonly classStudentService: ClassStudentService) {}

  @Post()
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Matricula um estudante em uma turma (ação do professor)',
    description:
      'Para fluxo iniciado pelo estudante use ' +
      '`POST /student-class-permission-request` e aprove em seguida.',
  })
  create(@Body() body: CreateClassStudentDto, @CurrentUser() user: AuthUser) {
    return this.classStudentService.create(body, user);
  }

  @Get('class/:classId')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Lista estudantes de uma turma',
    description:
      'Disponível para o professor dono, admins, ou estudantes matriculados ' +
      'na turma.',
  })
  async getByClassId(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query() query: GetClassStudentsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const { students, total } = await this.classStudentService.getByClassId(
      classId,
      query,
      user,
    );
    return paginate(students, total, query);
  }

  @Delete(':classId/:studentId')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Remove estudante da turma',
    description:
      'Permitido para: professor dono, admin, ou o próprio estudante ' +
      '(desmatrícula).',
  })
  delete(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.classStudentService.delete(classId, studentId, user);
  }
}
