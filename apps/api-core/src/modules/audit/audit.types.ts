import { Prisma, Role } from '@prisma/client';

export const AuditAction = {
  submissionFeedbackUpdated: 'submission.feedback_updated',
  userRoleChanged: 'user.role_changed',
  userStatusChanged: 'user.status_changed',
  userEmailChanged: 'user.email_changed',
  classStudentAdded: 'class_student.added',
  classStudentRemoved: 'class_student.removed',
  professorPermissionDecided: 'professor_permission.decided',
  taskVisibilityChanged: 'task.visibility_changed',
  taskDeleted: 'task.deleted',
} as const;

export type AuditActionName = (typeof AuditAction)[keyof typeof AuditAction];

export type AuditEntityType =
  | 'Submission'
  | 'User'
  | 'ClassStudent'
  | 'ProfessorPermissionRequest'
  | 'Task';

export type AuditDiff = {
  before: Record<string, Prisma.InputJsonValue | null>;
  after: Record<string, Prisma.InputJsonValue | null>;
};

export type AuditActor = {
  userId: string;
  role: Role;
};

export type NewAuditEvent = {
  actor: AuditActor;
  action: AuditActionName;
  entityType: AuditEntityType;
  entityId: string;
  diff: AuditDiff;
};

export const classStudentEntityId = (classId: string, studentId: string) =>
  `${classId}:${studentId}`;

export const membershipDiff = (
  classId: string,
  studentId: string,
  action: 'added' | 'removed',
): AuditDiff => {
  const pair: Record<string, string> = { classId, studentId };
  return action === 'added'
    ? { before: {}, after: pair }
    : { before: pair, after: {} };
};
