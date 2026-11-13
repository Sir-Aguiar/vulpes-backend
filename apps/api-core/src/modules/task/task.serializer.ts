import { TaskWithRelations } from './entities/task.entity';

export interface SerializedTaskTest {
  testId: string;
  taskId: string;
  input: unknown;
  expectedOutput: string;
  expectedOutputType: string;
}

export type SerializedTask = Omit<TaskWithRelations, 'taskTests'> & {
  taskTests: SerializedTaskTest[];
};

const parseInput = (input: string[]): unknown => {
  const raw = input[0];
  try {
    return raw ? JSON.parse(raw) : raw;
  } catch {
    return raw;
  }
};

export const serializeTask = (task: TaskWithRelations): SerializedTask => ({
  ...task,
  taskTests: task.taskTests.map((test) => ({
    testId: test.testId,
    taskId: test.taskId,
    expectedOutput: test.expectedOutput,
    expectedOutputType: test.expectedOutputType,
    input: parseInput(test.input),
  })),
});

export const serializeTaskOrNull = (
  task: TaskWithRelations | null,
): SerializedTask | null => (task ? serializeTask(task) : null);
