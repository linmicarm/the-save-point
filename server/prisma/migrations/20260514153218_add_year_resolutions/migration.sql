-- CreateTable
CREATE TABLE "YearEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "theme" TEXT,
    "quote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YearEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resolution" (
    "id" TEXT NOT NULL,
    "yearEntryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "why" TEXT,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resolution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YearEntry_userId_idx" ON "YearEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "YearEntry_userId_year_key" ON "YearEntry"("userId", "year");

-- CreateIndex
CREATE INDEX "Resolution_yearEntryId_idx" ON "Resolution"("yearEntryId");

-- AddForeignKey
ALTER TABLE "YearEntry" ADD CONSTRAINT "YearEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resolution" ADD CONSTRAINT "Resolution_yearEntryId_fkey" FOREIGN KEY ("yearEntryId") REFERENCES "YearEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
