export type SubmissionStatus = 'NOT_SUBMITTED' | 'CORRECT' | 'INCORRECT';

export interface ClassTaskListDashboardColumn {
  classTaskListId: string;
  taskId: string;
  index: number;
  title: string;
  weight: number;
  submittedCount: number;
  correctCount: number;
  accuracyRate: number;
}

export interface ClassTaskListDashboardCell {
  classTaskListId: string;
  status: SubmissionStatus;
}

export interface ClassTaskListDashboardStudentRow {
  studentId: string;
  name: string;
  cells: ClassTaskListDashboardCell[];
  score: number;
  submissionsCount: number;
  lastSubmittedAt: Date | null;
}

export interface ClassTaskListDashboardHardestTask {
  classTaskListId: string;
  taskId: string;
  index: number;
  title: string;
  accuracyRate: number;
}

export interface ClassTaskListDashboardKpis {
  totalStudents: number;
  averageScore: number;
  completionRate: number;
  studentsWithoutSubmission: number;
  hardestTask: ClassTaskListDashboardHardestTask | null;
}

export interface ClassTaskListDashboardData {
  columns: ClassTaskListDashboardColumn[];
  kpis: ClassTaskListDashboardKpis;
  students: ClassTaskListDashboardStudentRow[];
}
