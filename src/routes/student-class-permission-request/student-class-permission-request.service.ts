import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { StudentClassPermissionRequestRepository } from '../../repositories/student-class-permission-request-repository';
import { ClassRepository } from '../../repositories/class-repository';
import { ClassStudentRepository } from '../../repositories/class-student-repository';
import {
  ICreateStudentClassPermissionRequestDTO,
  IGetStudentClassPermissionRequestsQuery,
} from '../../dtos/StudentClassPermissionRequest';

@Injectable()
export class StudentClassPermissionRequestService {
  constructor(
    private readonly studentClassPermissionRequestRepository: StudentClassPermissionRequestRepository,
    private readonly classRepository: ClassRepository,
    private readonly classStudentRepository: ClassStudentRepository,
  ) {}

  async create(
    data: ICreateStudentClassPermissionRequestDTO,
    studentId: string,
  ) {
    const classData = await this.classRepository.getById(data.classId);
    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }

    const isInClass = await this.classStudentRepository.isStudentInClass(
      data.classId,
      studentId,
    );
    if (isInClass) {
      throw new ConflictException('Você já está matriculado nesta turma');
    }

    const existingRequest =
      await this.studentClassPermissionRequestRepository.getByIds(
        data.classId,
        studentId,
      );
    if (existingRequest) {
      throw new ConflictException(
        'Você já tem uma solicitação pendente para esta turma',
      );
    }

    return await this.studentClassPermissionRequestRepository.create({
      ...data,
      studentId,
    });
  }

  async getByClassId(
    classId: string,
    query: IGetStudentClassPermissionRequestsQuery,
    userId: string,
    userRole: string,
  ) {
    const classData = await this.classRepository.getById(classId);
    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (classData.professorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para ver as solicitações desta turma',
      );
    }

    return await this.studentClassPermissionRequestRepository.getByClassId(
      classId,
      query,
    );
  }

  async getMyRequests(studentId: string) {
    return await this.studentClassPermissionRequestRepository.getByStudentId(
      studentId,
    );
  }

  async approve(
    classId: string,
    studentId: string,
    userId: string,
    userRole: string,
  ) {
    const classData = await this.classRepository.getById(classId);
    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (classData.professorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para aprovar solicitações desta turma',
      );
    }

    const request = await this.studentClassPermissionRequestRepository.getByIds(
      classId,
      studentId,
    );
    if (!request) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    await this.classStudentRepository.create({ classId, studentId });

    await this.studentClassPermissionRequestRepository.delete(
      classId,
      studentId,
    );

    return {
      message:
        'Solicitação aprovada com sucesso. Estudante adicionado à turma.',
    };
  }

  async reject(
    classId: string,
    studentId: string,
    userId: string,
    userRole: string,
  ) {
    const classData = await this.classRepository.getById(classId);
    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (classData.professorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para rejeitar solicitações desta turma',
      );
    }

    const request = await this.studentClassPermissionRequestRepository.getByIds(
      classId,
      studentId,
    );
    if (!request) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    await this.studentClassPermissionRequestRepository.delete(
      classId,
      studentId,
    );

    return { message: 'Solicitação rejeitada com sucesso.' };
  }

  async cancel(classId: string, studentId: string, userId: string) {
    if (studentId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para cancelar esta solicitação',
      );
    }

    await this.studentClassPermissionRequestRepository.delete(
      classId,
      studentId,
    );

    return { message: 'Solicitação cancelada com sucesso.' };
  }
}
