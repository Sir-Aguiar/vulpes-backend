import { Injectable } from '@nestjs/common';
import { ClassTaskList, Prisma } from '@prisma/client';
import { ApplicationError } from '../../../common/errors/application.error';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  ClassTaskListDashboardColumn,
  ClassTaskListDashboardData,
  SubmissionStatus,
} from '../dto/dashboard.dto';
import { CreateClassTaskListDto } from '../dto/create-class-task-list.dto';
import { GetClassTaskListsQueryDto } from '../dto/get-class-task-lists.dto';
import {
  ClassTaskListRepository,
  ClassTaskListWeightInput,
  ClassTaskListWithRelations,
} from './class-task-list.repository';

const CLASS_TASK_LIST_INCLUDE = {
  classTask: {
    include: {
      task: { include: { taskParams: true, taskTests: true } },
    },
  },
  list: true,
} satisfies Prisma.ClassTaskListInclude;

@Injectable()
export class PrismaClassTaskListRepository implements ClassTaskListRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClassTaskListDto): Promise<ClassTaskList> {
    try {
      return await this.prisma.classTaskList.create({
        data: {
          classTaskId: data.classTaskId,
          listId: data.listId,
          weight: data.weight,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ApplicationError(
            409,
            'Tarefa já está associada a esta lista',
            error,
          );
        }
        throw new ApplicationError(
          400,
          'Erro ao associar tarefa à lista',
          error,
        );
      }
      throw error;
    }
  }

  async createMany(
    listId: string,
    tasks: ClassTaskListWeightInput[],
  ): Promise<{ count: number }> {
    try {
      const result = await this.prisma.classTaskList.createMany({
        data: tasks.map(({ classTaskId, weight }) => ({
          classTaskId,
          listId,
          weight: weight ?? 1.0,
        })),
        skipDuplicates: true,
      });
      return { count: result.count };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao associar tarefas à lista',
          error,
        );
      }
      throw error;
    }
  }

  getByIds(
    classTaskId: string,
    listId: string,
  ): Promise<ClassTaskListWithRelations | null> {
    return this.prisma.classTaskList.findFirst({
      where: { classTaskId, listId },
      include: CLASS_TASK_LIST_INCLUDE,
    });
  }

  getById(classTaskListId: string): Promise<ClassTaskListWithRelations | null> {
    return this.prisma.classTaskList.findUnique({
      where: { classTaskListId },
      include: CLASS_TASK_LIST_INCLUDE,
    });
  }

  async getByListId(
    listId: string,
    query: GetClassTaskListsQueryDto,
  ): Promise<{ classTaskLists: ClassTaskListWithRelations[]; total: number }> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [classTaskLists, total] = await this.prisma.$transaction([
      this.prisma.classTaskList.findMany({
        where: { listId },
        include: CLASS_TASK_LIST_INCLUDE,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.classTaskList.count({ where: { listId } }),
    ]);

    return { classTaskLists, total };
  }

  async delete(classTaskListId: string): Promise<void> {
    try {
      await this.prisma.classTaskList.delete({
        where: { classTaskListId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ApplicationError(
            404,
            'Tarefa não encontrada na lista',
            error,
          );
        }
        throw new ApplicationError(
          400,
          'Erro ao remover tarefa da lista',
          error,
        );
      }
      throw error;
    }
  }

  async deleteMany(
    listId: string,
    classTaskIds: string[],
  ): Promise<{ count: number }> {
    try {
      const result = await this.prisma.classTaskList.deleteMany({
        where: { listId, classTaskId: { in: classTaskIds } },
      });
      return { count: result.count };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApplicationError(
          400,
          'Erro ao remover tarefas da lista',
          error,
        );
      }
      throw error;
    }
  }

  async getDashboardData(
    classId: string,
    listId: string,
  ): Promise<ClassTaskListDashboardData> {
    const classTaskLists = await this.prisma.classTaskList.findMany({
      where: { listId },
      include: {
        classTask: {
          include: { task: { select: { taskId: true, title: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const classStudents = await this.prisma.classStudent.findMany({
      where: { classId },
      include: { student: { select: { userId: true, name: true } } },
    });

    const studentIds = classStudents.map((student) => student.studentId);
    const classTaskListIds = classTaskLists.map(
      (classTaskList) => classTaskList.classTaskListId,
    );

    const submissions = await this.prisma.submission.findMany({
      where: {
        classTaskListId: { in: classTaskListIds },
        studentId: { in: studentIds },
      },
      orderBy: { submittedAt: 'desc' },
      select: {
        submissionId: true,
        studentId: true,
        classTaskListId: true,
        isCorrect: true,
        submittedAt: true,
      },
    });

    const submissionsByCell = new Map<string, typeof submissions>();
    for (const submission of submissions) {
      const key = `${submission.classTaskListId}:${submission.studentId}`;
      const group = submissionsByCell.get(key);
      if (group) {
        group.push(submission);
        continue;
      }
      submissionsByCell.set(key, [submission]);
    }

    const columns: ClassTaskListDashboardColumn[] = classTaskLists.map(
      (classTaskList, i) => {
        let submittedCount = 0;
        let correctCount = 0;

        for (const studentId of studentIds) {
          const last = submissionsByCell.get(
            `${classTaskList.classTaskListId}:${studentId}`,
          )?.[0];
          if (last) {
            submittedCount += 1;
            if (last.isCorrect) correctCount += 1;
          }
        }

        return {
          classTaskListId: classTaskList.classTaskListId,
          taskId: classTaskList.classTask?.taskId ?? '',
          index: i + 1,
          title: classTaskList.classTask?.task?.title ?? '',
          weight: Number(classTaskList.weight),
          submittedCount,
          correctCount,
          accuracyRate:
            submittedCount === 0 ? 0 : correctCount / submittedCount,
        };
      },
    );

    const totalWeight = columns.reduce((sum, column) => sum + column.weight, 0);

    let studentsWithoutSubmission = 0;
    let completedStudents = 0;
    let scoreSum = 0;

    const students = classStudents.map((classStudent) => {
      let submissionsCount = 0;
      let submittedTasks = 0;
      let earnedWeight = 0;
      let lastSubmittedAt: Date | null = null;

      const cells = columns.map((column) => {
        const group = submissionsByCell.get(
          `${column.classTaskListId}:${classStudent.studentId}`,
        );
        const last = group?.[0] ?? null;

        if (last) {
          submissionsCount += group!.length;
          submittedTasks += 1;
          if (!lastSubmittedAt || last.submittedAt > lastSubmittedAt) {
            lastSubmittedAt = last.submittedAt;
          }
          if (last.isCorrect) earnedWeight += column.weight;
        }

        const status: SubmissionStatus = !last
          ? 'NOT_SUBMITTED'
          : last.isCorrect
            ? 'CORRECT'
            : 'INCORRECT';

        return { classTaskListId: column.classTaskListId, status };
      });

      const score = totalWeight === 0 ? 0 : (earnedWeight / totalWeight) * 100;
      const roundedScore = Math.round(score * 100) / 100;

      if (submissionsCount === 0) studentsWithoutSubmission += 1;
      if (columns.length > 0 && submittedTasks === columns.length) {
        completedStudents += 1;
      }
      scoreSum += roundedScore;

      return {
        studentId: classStudent.studentId,
        name: classStudent.student.name,
        cells,
        score: roundedScore,
        submissionsCount,
        lastSubmittedAt,
      };
    });

    const totalStudents = classStudents.length;
    const columnsWithSubmissions = columns.filter(
      (column) => column.submittedCount > 0,
    );
    const hardestColumn =
      columnsWithSubmissions.length === 0
        ? null
        : columnsWithSubmissions.reduce((min, column) =>
            column.accuracyRate < min.accuracyRate ? column : min,
          );

    return {
      columns,
      kpis: {
        totalStudents,
        averageScore:
          totalStudents === 0
            ? 0
            : Math.round((scoreSum / totalStudents) * 100) / 100,
        completionRate:
          totalStudents === 0 ? 0 : completedStudents / totalStudents,
        studentsWithoutSubmission,
        hardestTask: hardestColumn
          ? {
              classTaskListId: hardestColumn.classTaskListId,
              taskId: hardestColumn.taskId,
              index: hardestColumn.index,
              title: hardestColumn.title,
              accuracyRate: hardestColumn.accuracyRate,
            }
          : null,
      },
      students,
    };
  }
}
