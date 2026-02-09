-- AddForeignKey
ALTER TABLE "professor_permission_requests" ADD CONSTRAINT "professor_permission_requests_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("institutionId") ON DELETE CASCADE ON UPDATE CASCADE;
