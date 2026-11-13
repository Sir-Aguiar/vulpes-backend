import { Task, TaskParam, TaskTest } from '@prisma/client';

export interface TaskWithRelations extends Task {
  taskParams: TaskParam[];
  taskTests: TaskTest[];
}
