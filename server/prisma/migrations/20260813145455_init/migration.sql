-- CreateEnum
CREATE TYPE "TranscriptionStatus" AS ENUM ('SAVED', 'SUMMARIZING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "segments" JSONB NOT NULL,
    "summary" TEXT,
    "durationSeconds" INTEGER,
    "wordCount" INTEGER,
    "status" "TranscriptionStatus" NOT NULL DEFAULT 'SAVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transcription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Transcription_userId_idx" ON "Transcription"("userId");

-- CreateIndex
CREATE INDEX "Transcription_createdAt_idx" ON "Transcription"("createdAt");

-- AddForeignKey
ALTER TABLE "Transcription" ADD CONSTRAINT "Transcription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
