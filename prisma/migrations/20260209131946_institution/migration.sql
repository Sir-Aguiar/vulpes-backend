/*
  Warnings:

  - You are about to drop the column `institution` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "institution",
ADD COLUMN     "institutionId" INTEGER;

-- CreateTable
CREATE TABLE "Institution" (
    "institutionId" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("institutionId")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("institutionId") ON DELETE SET NULL ON UPDATE CASCADE;
