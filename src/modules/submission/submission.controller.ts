import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { CreateSubmissionDto } from './dto/create-submission.dto';
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

  @Get('list/:listId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Lista submissões de uma lista' })
  getByListId(@Param('listId', ParseUUIDPipe) listId: string) {
    return this.submissionService.getByListId(listId);
  }

  @Put('feedback/:id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Envia feedback do professor para uma submissão' })
  sendFeedback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SendFeedbackDto,
  ) {
    return this.submissionService.sendFeedback(id, body);
  }

  @Get('feedbacks')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Lista feedbacks de um aluno' })
  getFeedbacks(@CurrentUser() user: AuthUser) {
    return this.submissionService.getFeedbacks(user);
  }
}
