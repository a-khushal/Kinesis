-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED');

-- CreateTable
CREATE TABLE "Videos" (
    "videoId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "s3InputKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "resolutions" TEXT[],
    "s3OutputPaths" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Videos_pkey" PRIMARY KEY ("videoId")
);
