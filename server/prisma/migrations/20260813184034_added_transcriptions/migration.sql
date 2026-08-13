/*
  Warnings:

  - The values [SAVED,SUMMARIZING,READY] on the enum `TranscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `durationSeconds` on the `Transcription` table. All the data in the column will be lost.
  - You are about to drop the column `segments` on the `Transcription` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `Transcription` table. All the data in the column will be lost.
  - You are about to drop the column `transcript` on the `Transcription` table. All the data in the column will be lost.
  - You are about to drop the column `wordCount` on the `Transcription` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TranscriptionStatus_new" AS ENUM ('RECORDING', 'COMPLETED', 'FAILED');
ALTER TABLE "public"."Transcription" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Transcription" ALTER COLUMN "status" TYPE "TranscriptionStatus_new" USING ("status"::text::"TranscriptionStatus_new");
ALTER TYPE "TranscriptionStatus" RENAME TO "TranscriptionStatus_old";
ALTER TYPE "TranscriptionStatus_new" RENAME TO "TranscriptionStatus";
DROP TYPE "public"."TranscriptionStatus_old";
ALTER TABLE "Transcription" ALTER COLUMN "status" SET DEFAULT 'COMPLETED';
COMMIT;

-- DropIndex
DROP INDEX "Transcription_createdAt_idx";

-- AlterTable
ALTER TABLE "Transcription" DROP COLUMN "durationSeconds",
DROP COLUMN "segments",
DROP COLUMN "summary",
DROP COLUMN "transcript",
DROP COLUMN "wordCount",
ADD COLUMN     "duration" DOUBLE PRECISION,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'COMPLETED';

-- CreateTable
CREATE TABLE "TranscriptSegment" (
    "id" TEXT NOT NULL,
    "transcriptionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "start" DOUBLE PRECISION NOT NULL,
    "end" DOUBLE PRECISION NOT NULL,
    "speaker" INTEGER,
    "confidence" DOUBLE PRECISION,

    CONSTRAINT "TranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TranscriptSegment_transcriptionId_idx" ON "TranscriptSegment"("transcriptionId");

-- CreateIndex
CREATE INDEX "Transcription_userId_createdAt_idx" ON "Transcription"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_transcriptionId_fkey" FOREIGN KEY ("transcriptionId") REFERENCES "Transcription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
