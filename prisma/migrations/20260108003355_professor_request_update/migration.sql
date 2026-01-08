/*
  Warnings:

  - You are about to drop the column `status` on the `teacher_permission_requests` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[personalEmail]` on the table `teacher_permission_requests` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `institution` to the `teacher_permission_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `institutionalEmail` to the `teacher_permission_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `teacher_permission_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `personalEmail` to the `teacher_permission_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestFile` to the `teacher_permission_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "teacher_permission_requests" DROP COLUMN "status",
ADD COLUMN     "institution" VARCHAR(255) NOT NULL,
ADD COLUMN     "institutionalEmail" VARCHAR(255) NOT NULL,
ADD COLUMN     "name" VARCHAR(255) NOT NULL,
ADD COLUMN     "personalEmail" VARCHAR(255) NOT NULL,
ADD COLUMN     "requestFile" TEXT NOT NULL,
ADD COLUMN     "requestStatus" "TeacherPermissionRequestStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "teacher_permission_requests_personalEmail_key" ON "teacher_permission_requests"("personalEmail");
