-- CreateEnum
CREATE TYPE "SummaryStatus" AS ENUM ('NONE', 'PENDING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "Transcription" ADD COLUMN     "summary" TEXT,
ADD COLUMN     "summaryStatus" "SummaryStatus" NOT NULL DEFAULT 'NONE';
