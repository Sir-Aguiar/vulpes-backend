-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userPreferences" JSONB NOT NULL DEFAULT '{}';
