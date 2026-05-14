-- CreateTable
CREATE TABLE "MonthEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "mood" TEXT,
    "theme" TEXT,
    "highlight" TEXT,
    "focus" TEXT,
    "foods" TEXT,
    "selfCare" TEXT,
    "activities" TEXT,
    "media" TEXT,
    "other" TEXT,
    "photoUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthEntry_userId_idx" ON "MonthEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthEntry_userId_year_month_key" ON "MonthEntry"("userId", "year", "month");

-- AddForeignKey
ALTER TABLE "MonthEntry" ADD CONSTRAINT "MonthEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
