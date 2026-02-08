import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { StudentClassPermissionRequestService } from './student-class-permission-request.service';
import { ZodValidationPipe } from '../../pipes/Zod.pipe';
import * as StudentClassPermissionRequestDTO from '../../dtos/StudentClassPermissionRequest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('student-class-permission-request')
export class StudentClassPermissionRequestController {
  constructor(
    private readonly studentClassPermissionRequestService: StudentClassPermissionRequestService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  async createRequest(
    @Body(
      new ZodValidationPipe(
        StudentClassPermissionRequestDTO.CreateStudentClassPermissionRequestSchema,
      ),
    )
    body: StudentClassPermissionRequestDTO.ICreateStudentClassPermissionRequestDTO,
    @CurrentUser() user: any,
  ) {
    return this.studentClassPermissionRequestService.create(body, user.userId);
  }

  @Get('my-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  async getMyRequests(@CurrentUser() user: any) {
    return this.studentClassPermissionRequestService.getMyRequests(user.userId);
  }

  @Get('class/:classId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async getRequestsByClassId(
    @Param('classId') classId: string,
    @Query(
      new ZodValidationPipe(
        StudentClassPermissionRequestDTO.GetStudentClassPermissionRequestsQuerySchema,
      ),
    )
    query: StudentClassPermissionRequestDTO.IGetStudentClassPermissionRequestsQuery,
    @CurrentUser() user: any,
  ) {
    const result = await this.studentClassPermissionRequestService.getByClassId(
      classId,
      query,
      user.userId,
      user.role,
    );
    return {
      requests: result.requests,
      total: result.total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(result.total / query.limit),
    };
  }

  @Patch(':classId/:studentId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async approveRequest(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: any,
  ) {
    return this.studentClassPermissionRequestService.approve(
      classId,
      studentId,
      user.userId,
      user.role,
    );
  }

  @Patch(':classId/:studentId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async rejectRequest(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: any,
  ) {
    return this.studentClassPermissionRequestService.reject(
      classId,
      studentId,
      user.userId,
      user.role,
    );
  }

  @Delete(':classId/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  async cancelRequest(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: any,
  ) {
    return this.studentClassPermissionRequestService.cancel(
      classId,
      studentId,
      user.userId,
    );
  }
}
