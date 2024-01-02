/*
  Warnings:

  - The primary key for the `SpotifySongTempo` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "SpotifySongTempo" DROP CONSTRAINT "SpotifySongTempo_pkey",
ADD CONSTRAINT "SpotifySongTempo_pkey" PRIMARY KEY ("id", "source");
