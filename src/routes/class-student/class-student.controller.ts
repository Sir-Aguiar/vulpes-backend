import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ClassStudentService } from './class-student.service';
import { ZodValidationPipe } from '../../pipes/Zod.pipe';
import * as ClassStudentDTO from '../../dtos/ClassStudent';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('class-student')
export class ClassStudentController {
  constructor(private readonly classStudentService: ClassStudentService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async createClassStudent(
    @Body(new ZodValidationPipe(ClassStudentDTO.CreateClassStudentSchema))
    body: ClassStudentDTO.ICreateClassStudentDTO,
    @CurrentUser() user: any,
  ) {
    return this.classStudentService.create(body, user.userId, user.role);
  }

  @Get('class/:classId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  async getStudentsByClassId(
    @Param('classId') classId: string,
    @Query(new ZodValidationPipe(ClassStudentDTO.GetClassStudentsQuerySchema))
    query: ClassStudentDTO.IGetClassStudentsQuery,
    @CurrentUser() user: any,
  ) {
    const result = await this.classStudentService.getByClassId(
      classId,
      query,
      user.userId,
      user.role,
    );
    return {
      students: result.students,
      total: result.total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(result.total / query.limit),
    };
  }

  @Delete(':classId/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  async deleteClassStudent(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: any,
  ) {
    return this.classStudentService.delete(
      classId,
      studentId,
      user.userId,
      user.role,
    );
  }
}
