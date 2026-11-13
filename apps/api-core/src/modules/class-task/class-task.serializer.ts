import { ClassTaskWithRelations } from './repositories/class-task.repository';

const parseInput = (raw: string | undefined): unknown => {
  if (!raw) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

export const serializeClassTask = (classTask: ClassTaskWithRelations) => ({
  ...classTask,
  task: classTask.task
    ? {
        ...classTask.task,
        taskTests: classTask.task.taskTests?.map((test) => ({
          ...test,
          input: parseInput(test.input?.[0]),
        })),
      }
    : null,
});
