/*
  Warnings:

  - You are about to drop the column `requestFile` on the `teacher_permission_requests` table. All the data in the column will be lost.
  - Added the required column `requestFileUrl` to the `teacher_permission_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "teacher_permission_requests" DROP COLUMN "requestFile",
ADD COLUMN     "requestFileUrl" TEXT NOT NULL;
