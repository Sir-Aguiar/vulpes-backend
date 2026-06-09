/*
  Warnings:

  - The `severity` column on the `BugReport` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `BugReport` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BugReportStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "BugReportSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "BugReport" DROP COLUMN "severity",
ADD COLUMN     "severity" "BugReportSeverity" NOT NULL DEFAULT 'LOW',
DROP COLUMN "status",
ADD COLUMN     "status" "BugReportStatus" NOT NULL DEFAULT 'OPEN';
