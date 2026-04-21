import { ClassStudent } from '@prisma/client';
import { CreateClassStudentDto } from '../dto/create-class-student.dto';
import { GetClassStudentsQueryDto } from '../dto/get-class-students.dto';

export interface ClassStudentWithRelations extends ClassStudent {
  student?: {
    userId: string;
    name: string;
    email: string;
  };
  class?: {
    classId: string;
    name: string;
    code: number;
  };
}

export abstract class ClassStudentRepository {
  abstract create(data: CreateClassStudentDto): Promise<ClassStudent>;
  abstract getByIds(
    classId: string,
    studentId: string,
  ): Promise<ClassStudentWithRelations | null>;
  abstract getByClassId(
    classId: string,
    query: GetClassStudentsQueryDto,
  ): Promise<{ students: ClassStudentWithRelations[]; total: number }>;
  abstract delete(classId: string, studentId: string): Promise<void>;
  abstract isStudentInClass(
    classId: string,
    studentId: string,
  ): Promise<boolean>;
}
