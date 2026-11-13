import { Class } from '@prisma/client';
import { CreateClassDto } from '../dto/create-class.dto';
import { GetClassesQueryDto } from '../dto/get-classes.dto';
import { UpdateClassDto } from '../dto/update-class.dto';

export interface ClassWithRelations extends Class {
  professor?: {
    userId: string;
    name: string;
    email: string;
  };
  _count?: {
    classStudents: number;
    classTasks: number;
    lists: number;
  };
}

export interface CreateClassData extends CreateClassDto {
  professorId: string;
  code: number;
}

export abstract class ClassRepository {
  abstract create(data: CreateClassData): Promise<Class>;
  abstract getById(classId: string): Promise<ClassWithRelations | null>;
  abstract getByIds(classIds: string[]): Promise<ClassWithRelations[]>;
  abstract getByCode(code: number): Promise<ClassWithRelations | null>;
  abstract getAll(
    query: GetClassesQueryDto,
  ): Promise<{ classes: ClassWithRelations[]; total: number }>;
  abstract update(classId: string, data: UpdateClassDto): Promise<Class>;
  abstract delete(classId: string): Promise<void>;
  abstract generateUniqueCode(maxAttempts?: number): Promise<number>;
  abstract getClassesByStudentId(
    studentId: string,
  ): Promise<ClassWithRelations[]>;
}
