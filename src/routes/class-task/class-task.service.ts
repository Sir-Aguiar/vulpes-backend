import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ClassTaskRepository } from '../../repositories/class-task-repository';
import { ClassRepository } from '../../repositories/class-repository';
import { TaskRepository } from '../../repositories/task-repository';
import { ClassStudentRepository } from '../../repositories/class-student-repository';
import { ICreateClassTaskDTO, IGetClassTasksQuery } from '../../dtos/ClassTask';

@Injectable()
export class ClassTaskService {
  constructor(
    private readonly classTaskRepository: ClassTaskRepository,
    private readonly classRepository: ClassRepository,
    private readonly taskRepository: TaskRepository,
    private readonly classStudentRepository: ClassStudentRepository,
  ) {}

  async create(data: ICreateClassTaskDTO, userId: string, userRole: string) {
    const classData = await this.classRepository.getById(data.classId);
    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (classData.professorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para adicionar tarefas a esta turma',
      );
    }

    const task = await this.taskRepository.getById(data.taskId);
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    if (classData.professorId === userId && userRole !== 'ADMIN') {
      const isPublicAndVisible = task.isPublic && task.isVisible;
      const isOwnTask = task.creatorId === userId;

      if (!isPublicAndVisible && !isOwnTask) {
        throw new ForbiddenException(
          'Você só pode adicionar tarefas públicas e visíveis, ou tarefas criadas por você',
        );
      }
    }

    if (!task.isVisible) {
      throw new BadRequestException(
        'Não é possível adicionar uma tarefa não visível à turma',
      );
    }

    return await this.classTaskRepository.create(data);
  }

  async getByClassId(
    classId: string,
    query: IGetClassTasksQuery,
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
        'Você não tem permissão para ver as tarefas desta turma',
      );
    }

    const result = await this.classTaskRepository.getByClassId(classId, query);

    const formattedClassTasks = result.classTasks.map((ct: any) => ({
      ...ct,
      task: ct.task
        ? {
            ...ct.task,
            taskTests: ct.task.taskTests?.map((testCase: any) => ({
              ...testCase,
              input: JSON.parse(testCase.input),
            })),
          }
        : null,
    }));

    return { classTasks: formattedClassTasks, total: result.total };
  }

  async delete(
    classId: string,
    taskId: string,
    userId: string,
    userRole: string,
  ) {
    const classData = await this.classRepository.getById(classId);
    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (classData.professorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para remover tarefas desta turma',
      );
    }

    const classTask = await this.classTaskRepository.getByIds(classId, taskId);
    if (!classTask) {
      throw new NotFoundException('Tarefa não encontrada na turma');
    }

    await this.classTaskRepository.delete(classId, taskId);
    return { message: 'Tarefa removida da turma com sucesso' };
  }
}
