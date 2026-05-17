-- AlterTable

ALTER TABLE "Submission" ADD COLUMN "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Fallback to populate the "updatedAt" column with the value of "submittedAt" for existing records
UPDATE "Submission" SET "updatedAt" = "submittedAt";

ALTER TABLE "Submission" ALTER COLUMN "updatedAt" SET NOT NULL;