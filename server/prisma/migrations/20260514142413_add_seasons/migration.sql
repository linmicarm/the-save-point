-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '✦',
    "color" TEXT NOT NULL DEFAULT '#c4b5fd',
    "intention" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Season_userId_idx" ON "Season"("userId");

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
