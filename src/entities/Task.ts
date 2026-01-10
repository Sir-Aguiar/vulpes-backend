import { Task, TaskParam, TaskTest } from '@prisma/client';

export interface ITask extends Task {
  taskParams: TaskParam[];
  taskTests: TaskTest[];
}
