-- CreateTable
CREATE TABLE "BugReport" (
    "bugReportId" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expectedBehavior" TEXT,
    "actualBehavior" TEXT,
    "stepsToReproduce" TEXT,
    "screenshots" TEXT[],
    "browser" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("bugReportId")
);

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
