-- AlterTable
ALTER TABLE "Season" ADD COLUMN     "coverUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isDiscoverable" BOOLEAN NOT NULL DEFAULT false;
