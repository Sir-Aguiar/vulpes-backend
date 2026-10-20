import {
  Body,
  Controller,
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
import type { AuthUser } from '../../common/types/auth-user.type';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { GetFeedbacksQueryDto } from './dto/get-feedbacks.dto';
import { SendFeedbackDto } from './dto/send-feedback.dto';
import { SubmissionService } from './submission.service';

@ApiTags('submission')
@ApiBearerAuth('bearer')
@Controller('submission')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Envia uma submissão de código',
    description:
      'O `studentId` é extraído do JWT; o cliente não precisa (nem deve) ' +
      'enviá-lo.',
  })
  create(@Body() body: CreateSubmissionDto, @CurrentUser() user: AuthUser) {
    return this.submissionService.create(body, user);
  }

  @Get('task/:taskId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Lista submissões de uma tarefa' })
  getByTaskId(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.submissionService.getByTaskId(taskId);
  }

  @Get('class-task/:classTaskId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Lista submissões de uma tarefa na turma' })
  getByClassTaskId(@Param('classTaskId', ParseUUIDPipe) classTaskId: string) {
    return this.submissionService.getByClassTaskId(classTaskId);
  }

  @Get('class-task-list/:classTaskListId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Lista submissões de uma tarefa em uma lista' })
  getByClassTaskListId(
    @Param('classTaskListId', ParseUUIDPipe) classTaskListId: string,
  ) {
    return this.submissionService.getByClassTaskListId(classTaskListId);
  }

  @Put('feedback/:id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Envia feedback do professor para uma submissão',
    description:
      'Professor só envia feedback se for o dono da turma da submissão ' +
      '(via tarefa da turma ou tarefa da lista). ADMIN não tem essa restrição.',
  })
  sendFeedback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SendFeedbackDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.submissionService.sendFeedback(id, body, user);
  }

  @Get('feedbacks')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Lista feedbacks de um aluno',
    description:
      '`isWidget=true` devolve no máximo 5 feedbacks recentes. ' +
      '`isWidget=false` ou a ausência do parâmetro devolve a lista completa.',
  })
  getFeedbacks(
    @CurrentUser() user: AuthUser,
    @Query() query: GetFeedbacksQueryDto,
  ) {
    return this.submissionService.getFeedbacks(user, query.isWidget);
  }
}
