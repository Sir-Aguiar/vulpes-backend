import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ListRepository } from '../../repositories/list-repository';
import { ClassRepository } from '../../repositories/class-repository';
import { ClassStudentRepository } from '../../repositories/class-student-repository';
import {
  ICreateListDTO,
  IGetListsQuery,
  IUpdateListDTO,
} from '../../dtos/List';

@Injectable()
export class ListService {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly classRepository: ClassRepository,
    private readonly classStudentRepository: ClassStudentRepository,
  ) {}

  async create(data: ICreateListDTO, userId: string, userRole: string) {
    const classData = await this.classRepository.getById(data.classId);
    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (classData.professorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para criar listas nesta turma',
      );
    }

    return await this.listRepository.create(data);
  }

  async getById(listId: string, userId: string, userRole: string) {
    const list = await this.listRepository.getById(listId);
    if (!list) {
      throw new NotFoundException('Lista não encontrada');
    }
    const isStudentInClass = await this.classStudentRepository.isStudentInClass(
      list.classId,
      userId,
    );
    if (
      list.class?.professorId !== userId &&
      userRole !== 'ADMIN' &&
      !isStudentInClass
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para ver esta lista',
      );
    }

    return list;
  }

  async getByClassId(
    classId: string,
    query: IGetListsQuery,
    userId: string,
    userRole: string,
  ) {
    const classData = await this.classRepository.getById(classId);
    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }

    const isStudentInClass = await this.classStudentRepository.isStudentInClass(
      classId,
      userId,
    );
    if (
      classData.professorId !== userId &&
      userRole !== 'ADMIN' &&
      !isStudentInClass
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para ver as listas desta turma',
      );
    }

    return await this.listRepository.getByClassId(classId, query);
  }

  async update(
    listId: string,
    data: IUpdateListDTO,
    userId: string,
    userRole: string,
  ) {
    const list = await this.listRepository.getById(listId);
    if (!list) {
      throw new NotFoundException('Lista não encontrada');
    }

    if (list.class?.professorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar esta lista',
      );
    }

    return await this.listRepository.update(listId, data);
  }

  async delete(listId: string, userId: string, userRole: string) {
    const list = await this.listRepository.getById(listId);
    if (!list) {
      throw new NotFoundException('Lista não encontrada');
    }

    if (list.class?.professorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para excluir esta lista',
      );
    }

    await this.listRepository.delete(listId);
    return { message: 'Lista excluída com sucesso' };
  }
}
