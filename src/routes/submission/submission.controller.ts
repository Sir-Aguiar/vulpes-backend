import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { ZodValidationPipe } from '../../pipes/Zod.pipe';
import * as Submission from '../../dtos/Submission';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('submission')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @UsePipes()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  async create(
    @Body(
      new ZodValidationPipe(
        Submission.CreateSubmissionSchema.omit({ studentId: true }),
      ),
    )
    body: Submission.ICreateSubmissionDTO,
    @CurrentUser() user: any,
  ) {
    body.studentId = user.userId;
    const result = await this.submissionService.create(body);
    return result;
  }

  @Get('task/:taskId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async getByTaskId(@Param('taskId') taskId: string) {
    const result = await this.submissionService.getByTaskId(taskId);
    return result;
  }

  @Put('feedback/:id')
  @UsePipes()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async sendFeedback(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(Submission.SendFeedbackSchema))
    body: Submission.ISendFeedbackDTO,
  ) {
    const result = await this.submissionService.sendFeedback(id, body);
    return result;
  }
}
