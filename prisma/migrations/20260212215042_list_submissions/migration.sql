-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "listId" TEXT;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("listId") ON DELETE SET NULL ON UPDATE CASCADE;
