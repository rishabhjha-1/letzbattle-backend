-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "expired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gameName" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "isopen" BOOLEAN NOT NULL DEFAULT true;
