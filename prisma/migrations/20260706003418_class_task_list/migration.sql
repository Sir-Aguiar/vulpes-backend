/*
  Warnings:

  - The primary key for the `ClassTask` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `listId` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the `TaskList` table. If the table is not empty, all the data it contains will be lost.
  - The required column `classTaskId` was added to the `ClassTask` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_listId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskList" DROP CONSTRAINT "TaskList_listId_fkey";

-- DropForeignKey
ALTER TABLE "TaskList" DROP CONSTRAINT "TaskList_taskId_fkey";

-- AlterTable
ALTER TABLE "ClassTask" DROP CONSTRAINT "ClassTask_pkey",
ADD COLUMN     "classTaskId" TEXT NOT NULL,
ADD CONSTRAINT "ClassTask_pkey" PRIMARY KEY ("classTaskId");

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "listId",
ADD COLUMN     "classTaskId" TEXT,
ADD COLUMN     "classTaskListId" TEXT,
ALTER COLUMN "taskId" DROP NOT NULL;

-- DropTable
DROP TABLE "TaskList";

-- CreateTable
CREATE TABLE "ClassTaskList" (
    "classTaskListId" TEXT NOT NULL,
    "classTaskId" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassTaskList_pkey" PRIMARY KEY ("classTaskListId")
);

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_classTaskId_fkey" FOREIGN KEY ("classTaskId") REFERENCES "ClassTask"("classTaskId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_classTaskListId_fkey" FOREIGN KEY ("classTaskListId") REFERENCES "ClassTaskList"("classTaskListId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTaskList" ADD CONSTRAINT "ClassTaskList_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("listId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTaskList" ADD CONSTRAINT "ClassTaskList_classTaskId_fkey" FOREIGN KEY ("classTaskId") REFERENCES "ClassTask"("classTaskId") ON DELETE CASCADE ON UPDATE CASCADE;
