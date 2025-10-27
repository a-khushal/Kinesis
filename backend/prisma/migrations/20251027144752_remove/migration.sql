/*
  Warnings:

  - You are about to drop the column `s3OutputPaths` on the `Videos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Videos" DROP COLUMN "s3OutputPaths";
