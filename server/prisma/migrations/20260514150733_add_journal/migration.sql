-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT,
    "body" TEXT NOT NULL,
    "mood" TEXT,
    "prompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JournalEntry_userId_idx" ON "JournalEntry"("userId");

-- CreateIndex
CREATE INDEX "JournalEntry_seasonId_idx" ON "JournalEntry"("seasonId");

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;
