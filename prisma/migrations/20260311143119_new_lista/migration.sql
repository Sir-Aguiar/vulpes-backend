/*
  Warnings:

  - You are about to drop the `ClassTaskList` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ClassTaskList" DROP CONSTRAINT "ClassTaskList_classId_taskId_fkey";

-- DropForeignKey
ALTER TABLE "ClassTaskList" DROP CONSTRAINT "ClassTaskList_listId_fkey";

-- DropTable
DROP TABLE "ClassTaskList";

-- CreateTable
CREATE TABLE "TaskList" (
    "taskId" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskList_pkey" PRIMARY KEY ("taskId","listId")
);

-- AddForeignKey
ALTER TABLE "TaskList" ADD CONSTRAINT "TaskList_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("listId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskList" ADD CONSTRAINT "TaskList_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE CASCADE ON UPDATE CASCADE;
