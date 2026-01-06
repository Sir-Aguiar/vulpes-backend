/*
  Warnings:

  - The `input` column on the `TaskTest` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "TaskTest" DROP COLUMN "input",
ADD COLUMN     "input" TEXT[];
