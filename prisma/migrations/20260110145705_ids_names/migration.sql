/*
  Warnings:

  - The primary key for the `Student` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Student` table. All the data in the column will be lost.
  - The primary key for the `Submission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Submission` table. All the data in the column will be lost.
  - The primary key for the `Task` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Task` table. All the data in the column will be lost.
  - The primary key for the `teacher_permission_requests` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `teacher_permission_requests` table. All the data in the column will be lost.
  - The required column `studentId` was added to the `Student` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `submissionId` was added to the `Submission` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `taskId` was added to the `Task` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskParam" DROP CONSTRAINT "TaskParam_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskTest" DROP CONSTRAINT "TaskTest_taskId_fkey";

-- AlterTable
ALTER TABLE "Student" DROP CONSTRAINT "Student_pkey",
DROP COLUMN "id",
ADD COLUMN     "studentId" TEXT NOT NULL,
ADD CONSTRAINT "Student_pkey" PRIMARY KEY ("studentId");

-- AlterTable
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_pkey",
DROP COLUMN "id",
ADD COLUMN     "submissionId" TEXT NOT NULL,
ADD CONSTRAINT "Submission_pkey" PRIMARY KEY ("submissionId");

-- AlterTable
ALTER TABLE "Task" DROP CONSTRAINT "Task_pkey",
DROP COLUMN "id",
ADD COLUMN     "taskId" TEXT NOT NULL,
ADD CONSTRAINT "Task_pkey" PRIMARY KEY ("taskId");

-- AlterTable
ALTER TABLE "teacher_permission_requests" DROP CONSTRAINT "teacher_permission_requests_pkey",
DROP COLUMN "id",
ADD COLUMN     "teacherPermissionRequestId" SERIAL NOT NULL,
ADD CONSTRAINT "teacher_permission_requests_pkey" PRIMARY KEY ("teacherPermissionRequestId");

-- AddForeignKey
ALTER TABLE "TaskParam" ADD CONSTRAINT "TaskParam_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTest" ADD CONSTRAINT "TaskTest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE CASCADE ON UPDATE CASCADE;
