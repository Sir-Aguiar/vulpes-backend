-- CreateEnum
CREATE TYPE "TeacherPermissionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "teacher_permission_requests" (
    "id" SERIAL NOT NULL,
    "status" "TeacherPermissionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_permission_requests_pkey" PRIMARY KEY ("id")
);
