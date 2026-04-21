import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ensureClassWriteAccess } from '../../common/authorization/authorization.helpers';
import { AuthUser } from '../../common/types/auth-user.type';
import { ClassStudentRepository } from '../class-student/repositories/class-student.repository';
import { ClassRepository } from '../class/repositories/class.repository';
import { CreateStudentClassPermissionRequestDto } from './dto/create-student-class-permission-request.dto';
import { GetStudentClassPermissionRequestsQueryDto } from './dto/get-student-class-permission-requests.dto';
import { StudentClassPermissionRequestRepository } from './repositories/student-class-permission-request.repository';

@Injectable()
export class StudentClassPermissionRequestService {
  constructor(
    private readonly repository: StudentClassPermissionRequestRepository,
    private readonly classRepository: ClassRepository,
    private readonly classStudentRepository: ClassStudentRepository,
  ) {}

  /**
   * Helper privado: valida que o usuário pode "gerenciar" (aprovar /
   * rejeitar / listar) solicitações da turma — ou seja, é o professor
   * dono ou ADMIN.
   */
  private async assertManagerAccess(classId: string, user: AuthUser) {
    const classData = await this.classRepository.getById(classId);
    if (!classData) throw new NotFoundException('Turma não encontrada');

    ensureClassWriteAccess(
      user,
      classData.professorId,
      'Você não tem permissão para gerenciar solicitações desta turma',
    );

    return classData;
  }

  /**
   * Cria uma solicitação de matrícula. `studentId` é o do usuário
   * autenticado — não confiamos em nada vindo do cliente nesse campo.
   *
   * Falhas:
   * - 409 se o usuário já é membro da turma.
   * - 409 se já existe uma solicitação pendente do mesmo par `(class, student)`.
   */
  async create(data: CreateStudentClassPermissionRequestDto, user: AuthUser) {
    const classData = await this.classRepository.getById(data.classId);
    if (!classData) throw new NotFoundException('Turma não encontrada');

    const isMember = await this.classStudentRepository.isStudentInClass(
      data.classId,
      user.userId,
    );
    if (isMember) {
      throw new ConflictException('Você já está matriculado nesta turma');
    }

    const existing = await this.repository.getByIds(data.classId, user.userId);
    if (existing) {
      throw new ConflictException(
        'Você já tem uma solicitação pendente para esta turma',
      );
    }

    return this.repository.create({ ...data, studentId: user.userId });
  }

  async getByClassId(
    classId: string,
    query: GetStudentClassPermissionRequestsQueryDto,
    user: AuthUser,
  ) {
    await this.assertManagerAccess(classId, user);
    return this.repository.getByClassId(classId, query);
  }

  getMyRequests(user: AuthUser) {
    return this.repository.getByStudentId(user.userId);
  }

  /**
   * Aprovação é atômica do ponto de vista do domínio: cria o
   * `ClassStudent` (matrícula) e remove a solicitação.
   *
   * Nota de risco: hoje as duas operações não rodam numa transação;
   * se a segunda falhar, o estudante fica matriculado com a solicitação
   * ainda pendente. Ver ADR específico para encaminhamento.
   */
  async approve(classId: string, studentId: string, user: AuthUser) {
    await this.assertManagerAccess(classId, user);

    const request = await this.repository.getByIds(classId, studentId);
    if (!request) throw new NotFoundException('Solicitação não encontrada');

    await this.classStudentRepository.create({ classId, studentId });
    await this.repository.delete(classId, studentId);

    return {
      message:
        'Solicitação aprovada com sucesso. Estudante adicionado à turma.',
    };
  }

  async reject(classId: string, studentId: string, user: AuthUser) {
    await this.assertManagerAccess(classId, user);

    const request = await this.repository.getByIds(classId, studentId);
    if (!request) throw new NotFoundException('Solicitação não encontrada');

    await this.repository.delete(classId, studentId);
    return { message: 'Solicitação rejeitada com sucesso.' };
  }

  /**
   * Cancelamento pelo próprio autor. Regra estrita: `studentId` no path
   * deve ser o mesmo do `userId` do JWT. Nem professor, nem admin podem
   * cancelar por aqui — eles usam `/reject`.
   */
  async cancel(classId: string, studentId: string, user: AuthUser) {
    if (studentId !== user.userId) {
      throw new ForbiddenException(
        'Você não tem permissão para cancelar esta solicitação',
      );
    }

    await this.repository.delete(classId, studentId);
    return { message: 'Solicitação cancelada com sucesso.' };
  }
}
