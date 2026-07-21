import { Injectable } from '@nestjs/common';
import { ClassTask, Prisma } from '@prisma/client';
import { ApplicationError } from '../../../common/errors/application.error';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { ClassTaskDashboardData } from '../dto/dashboard.dto';
import { CreateClassTaskDto } from '../dto/create-class-task.dto';
import { GetClassTasksQueryDto } from '../dto/get-class-tasks.dto';
import { MyClassTaskRow } from '../dto/my-tasks.dto';
import {
  ClassTaskRepository,
  ClassTaskWithRelations,
} from './class-task.repository';

const TASK_INCLUDE = {
  task: {
    include: {
      taskParams: true,
      taskTests: true,
      creator: { select: { userId: true, name: true } },
    },
  },
} satisfies Prisma.ClassTaskInclude;

const CLASS_SELECT = {
  classId: true,
  name: true,
  code: true,
  professorId: true,
} satisfies Prisma.ClassSelect;

const MY_TASKS_SELECT = {
  classTaskId: true,
  taskId: true,
  createdAt: true,
  class: { select: { classId: true, name: true, code: true } },
  task: {
    select: {
      taskId: true,
      title: true,
      description: true,
      creator: { select: { userId: true, name: true } },
    },
  },
} satisfies Prisma.ClassTaskSelect;

@Injectable()
export class PrismaClassTaskRepository implements ClassTaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClassTaskDto): Promise<ClassTask> {
    try {
      return await this.prisma.classTask.create({
        data: { classId: data.classId, taskId: data.taskId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ApplicationError(
            409,
            'Tarefa já está associada à turma',
            error,
          );
        }
        throw new ApplicationError(
          400,
          'Erro ao associar tarefa à turma',
          error,
        );
      }
      throw error;
    }
  }

  async createMany(
    classId: string,
    taskIds: string[],
  ): Promise<{ count: number }> {
    try {
      const result = await this.prisma.classTask.createMany({
        data: taskIds.map((taskId) => ({ classId, taskId })),
        skipDuplicates: true,
      });
      return { count: result.count };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao associar tarefas à turma',
          error,
        );
      }
      throw error;
    }
  }

  getById(classTaskId: string): Promise<ClassTaskWithRelations | null> {
    return this.prisma.classTask.findUnique({
      where: { classTaskId },
      include: { ...TASK_INCLUDE, class: { select: CLASS_SELECT } },
    });
  }

  getByIds(
    classId: string,
    taskId: string,
  ): Promise<ClassTaskWithRelations | null> {
    return this.prisma.classTask.findFirst({
      where: { classId, taskId },
      include: { ...TASK_INCLUDE, class: { select: CLASS_SELECT } },
    });
  }

  async getByClassId(
    classId: string,
    query: GetClassTasksQueryDto,
  ): Promise<{ classTasks: ClassTaskWithRelations[]; total: number }> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [classTasks, total] = await this.prisma.$transaction([
      this.prisma.classTask.findMany({
        where: { classId },
        include: TASK_INCLUDE,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.classTask.count({ where: { classId } }),
    ]);

    return { classTasks, total };
  }

  async delete(classId: string, taskId: string): Promise<void> {
    try {
      await this.prisma.classTask.deleteMany({
        where: { classId, taskId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao remover tarefa da turma',
          error,
        );
      }
      throw error;
    }
  }

  async isTaskInClass(classId: string, taskId: string): Promise<boolean> {
    const link = await this.prisma.classTask.findFirst({
      where: { classId, taskId },
    });
    return Boolean(link);
  }

  async deleteMany(
    classId: string,
    taskIds: string[],
  ): Promise<{ count: number }> {
    try {
      const result = await this.prisma.classTask.deleteMany({
        where: { classId, taskId: { in: taskIds } },
      });
      return { count: result.count };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao remover tarefas da turma',
          error,
        );
      }
      throw error;
    }
  }

  async getTasksInClass(classId: string, taskIds: string[]): Promise<string[]> {
    const items = await this.prisma.classTask.findMany({
      where: { classId, taskId: { in: taskIds } },
      select: { taskId: true },
    });
    return items.map((item) => item.taskId);
  }

  async getByClassIdAndTaskIds(
    classId: string,
    taskIds: string[],
  ): Promise<ClassTask[]> {
    return this.prisma.classTask.findMany({
      where: { classId, taskId: { in: taskIds } },
    });
  }

  getByTaskId(taskId: string): Promise<ClassTaskWithRelations[]> {
    return this.prisma.classTask.findMany({
      where: { taskId },
      include: { class: { select: CLASS_SELECT } },
    });
  }

  async getDashboardData(
    classId: string,
    classTaskId: string,
  ): Promise<ClassTaskDashboardData> {
    const classStudents = await this.prisma.classStudent.findMany({
      where: { classId },
      include: { student: { select: { userId: true, name: true } } },
    });

    const studentIds = classStudents.map((student) => student.studentId);

    const submissions = await this.prisma.submission.findMany({
      where: {
        classTaskId,
        studentId: { in: studentIds },
      },
      orderBy: { submittedAt: 'desc' },
      select: {
        submissionId: true,
        studentId: true,
        isCorrect: true,
        submittedAt: true,
        professorComments: true,
      },
    });

    const submissionsByStudent = new Map<string, typeof submissions>();
    for (const submission of submissions) {
      const group = submissionsByStudent.get(submission.studentId);
      if (group) {
        group.push(submission);
        continue;
      }
      submissionsByStudent.set(submission.studentId, [submission]);
    }

    let studentsWithSubmission = 0;
    let studentsCorrect = 0;
    let pendingFeedbackCount = 0;

    const students = classStudents.map((student) => {
      const studentSubmissions =
        submissionsByStudent.get(student.studentId) ?? [];
      const lastSubmission = studentSubmissions[0] ?? null;

      const status: ClassTaskDashboardData['students'][number]['status'] =
        !lastSubmission
          ? 'NOT_SUBMITTED'
          : lastSubmission.isCorrect
            ? 'CORRECT'
            : 'INCORRECT';

      const hasPendingFeedback =
        lastSubmission !== null && lastSubmission.professorComments === null;

      if (lastSubmission) studentsWithSubmission += 1;
      if (status === 'CORRECT') studentsCorrect += 1;
      if (hasPendingFeedback) pendingFeedbackCount += 1;

      return {
        studentId: student.studentId,
        name: student.student.name,
        status,
        submissionsCount: studentSubmissions.length,
        lastSubmissionId: lastSubmission?.submissionId ?? null,
        lastSubmittedAt: lastSubmission?.submittedAt ?? null,
        professorComments: lastSubmission?.professorComments ?? null,
        hasPendingFeedback,
      };
    });

    const totalStudents = classStudents.length;
    const studentsWithoutSubmission = totalStudents - studentsWithSubmission;

    return {
      kpis: {
        totalStudents,
        studentsWithSubmission,
        studentsWithoutSubmission,
        studentsCorrect,
        deliveryRate:
          totalStudents === 0 ? 0 : studentsWithSubmission / totalStudents,
        accuracyRate:
          studentsWithSubmission === 0
            ? 0
            : studentsCorrect / studentsWithSubmission,
        pendingFeedbackCount,
      },
      students,
    };
  }

  async getVisibleClassTasksByStudentId(
    studentId: string,
  ): Promise<MyClassTaskRow[]> {
    const classTasks = await this.prisma.classTask.findMany({
      where: {
        class: { classStudents: { some: { studentId } } },
        task: { isVisible: true, deletedAt: null },
      },
      select: MY_TASKS_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    return classTasks
      .filter((item) => item.task !== null && item.class !== null)
      .map((item) => ({
        classTaskId: item.classTaskId,
        taskId: item.taskId,
        createdAt: item.createdAt,
        class: item.class,
        task: item.task,
      }));
  }
}
