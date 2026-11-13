import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { paginate } from '../../common/pagination/pagination.types';
import type { AuthUser } from '../../common/types/auth-user.type';
import { CreateStudentClassPermissionRequestDto } from './dto/create-student-class-permission-request.dto';
import { GetStudentClassPermissionRequestsQueryDto } from './dto/get-student-class-permission-requests.dto';
import { StudentClassPermissionRequestService } from './student-class-permission-request.service';

@ApiTags('student-class-permission-request')
@ApiBearerAuth('bearer')
@Controller('student-class-permission-request')
export class StudentClassPermissionRequestController {
  constructor(private readonly service: StudentClassPermissionRequestService) {}

  @Post()
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Solicita matrícula em uma turma',
    description:
      'O `studentId` é inferido do JWT. Se o usuário já estiver matriculado ' +
      'ou já tiver uma solicitação pendente, a requisição falha com 409.',
  })
  create(
    @Body() body: CreateStudentClassPermissionRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(body, user);
  }

  @Get('my-requests')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Minhas solicitações pendentes' })
  getMyRequests(@CurrentUser() user: AuthUser) {
    return this.service.getMyRequests(user);
  }

  @Get('class/:classId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Solicitações pendentes para uma turma' })
  async getByClassId(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query() query: GetStudentClassPermissionRequestsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const { requests, total } = await this.service.getByClassId(
      classId,
      query,
      user,
    );
    return paginate(requests, total, query);
  }

  @Patch(':classId/:studentId/approve')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Aprova solicitação (matricula o estudante)',
    description:
      'Cria o vínculo `ClassStudent` e remove a solicitação. Apenas o ' +
      'professor dono da turma ou um ADMIN pode aprovar.',
  })
  approve(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.approve(classId, studentId, user);
  }

  @Patch(':classId/:studentId/reject')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Rejeita solicitação (apaga sem matricular)' })
  reject(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reject(classId, studentId, user);
  }

  @Delete(':classId/:studentId')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Cancela a própria solicitação',
    description:
      'Apenas o estudante autor pode cancelar (`studentId` deve ser igual ao ' +
      '`userId` do JWT).',
  })
  cancel(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.cancel(classId, studentId, user);
  }
}
