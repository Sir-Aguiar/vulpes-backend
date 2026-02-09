/*
  Warnings:

  - You are about to drop the column `institution` on the `professor_permission_requests` table. All the data in the column will be lost.
  - Added the required column `institutionId` to the `professor_permission_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "professor_permission_requests" DROP COLUMN "institution",
ADD COLUMN     "institutionId" INTEGER NOT NULL;
