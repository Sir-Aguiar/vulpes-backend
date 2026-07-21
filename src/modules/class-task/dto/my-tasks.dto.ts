export const MY_TASKS_PER_CLASS = 5;

export interface MyClassTaskItem {
  classTaskId: string;
  taskId: string;
  createdAt: Date;
  task: {
    taskId: string;
    title: string;
    description: string;
    creator: {
      userId: string;
      name: string;
    };
  };
}

export interface MyClassTaskRow extends MyClassTaskItem {
  class: {
    classId: string;
    name: string;
    code: number;
  };
}

export interface MyTasksClassSection {
  class: {
    classId: string;
    name: string;
    code: number;
  };
  tasks: MyClassTaskItem[];
  totalTasks: number;
  hasMore: boolean;
}

export interface MyTasksResponse {
  classes: MyTasksClassSection[];
}
