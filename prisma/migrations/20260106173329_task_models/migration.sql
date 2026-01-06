-- CreateEnum
CREATE TYPE "TaskInputMode" AS ENUM ('PARAM', 'LEIA');

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "functionDef" TEXT NOT NULL,
    "inputMode" "TaskInputMode" NOT NULL DEFAULT 'PARAM',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskParam" (
    "paramId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "isArray" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TaskParam_pkey" PRIMARY KEY ("paramId")
);

-- CreateTable
CREATE TABLE "TaskTest" (
    "testId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,

    CONSTRAINT "TaskTest_pkey" PRIMARY KEY ("testId")
);

-- AddForeignKey
ALTER TABLE "TaskParam" ADD CONSTRAINT "TaskParam_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTest" ADD CONSTRAINT "TaskTest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
