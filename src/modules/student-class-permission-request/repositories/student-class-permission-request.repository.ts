import { StudentClassPermissionRequest } from '@prisma/client';
import { CreateStudentClassPermissionRequestDto } from '../dto/create-student-class-permission-request.dto';
import { GetStudentClassPermissionRequestsQueryDto } from '../dto/get-student-class-permission-requests.dto';

export interface StudentClassPermissionRequestWithRelations extends StudentClassPermissionRequest {
  student?: {
    userId: string;
    name: string;
    email: string;
  };
  class?: {
    classId: string;
    name: string;
    code: number;
    professor: {
      userId: string;
      name: string;
    };
  };
}

export interface CreateStudentClassPermissionRequestData extends CreateStudentClassPermissionRequestDto {
  studentId: string;
}

export abstract class StudentClassPermissionRequestRepository {
  abstract create(
    data: CreateStudentClassPermissionRequestData,
  ): Promise<StudentClassPermissionRequest>;
  abstract getByIds(
    classId: string,
    studentId: string,
  ): Promise<StudentClassPermissionRequestWithRelations | null>;
  abstract getByClassId(
    classId: string,
    query: GetStudentClassPermissionRequestsQueryDto,
  ): Promise<{
    requests: StudentClassPermissionRequestWithRelations[];
    total: number;
  }>;
  abstract getByStudentId(
    studentId: string,
  ): Promise<StudentClassPermissionRequestWithRelations[]>;
  abstract delete(classId: string, studentId: string): Promise<void>;
}
