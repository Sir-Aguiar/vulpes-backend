import { TeacherPermissionRequest } from '@prisma/client';
import { ICreateTeacherPermissionDTO } from '../dtos/TeacherPermission';
import { prisma } from '../database/prismaClient';

export abstract class TeacherPermissionRepository {
  abstract create(
    data: ICreateTeacherPermissionDTO,
  ): Promise<TeacherPermissionRequest>;
}

export class PrismaTeacherPermissionRepository implements TeacherPermissionRepository {
  async create(
    data: ICreateTeacherPermissionDTO,
  ): Promise<TeacherPermissionRequest> {
    return await prisma.teacherPermissionRequest.create({
      data,
    });
  }
}
