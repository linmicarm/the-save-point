-- CreateTable
CREATE TABLE "RhythmBlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "items" TEXT[],
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RhythmBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RhythmBlock_userId_idx" ON "RhythmBlock"("userId");

-- AddForeignKey
ALTER TABLE "RhythmBlock" ADD CONSTRAINT "RhythmBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
