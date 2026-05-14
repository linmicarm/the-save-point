-- CreateTable
CREATE TABLE "HolidayEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "holidayName" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "celebration" TEXT,
    "food" TEXT,
    "people" TEXT,
    "mood" TEXT,
    "photoUrl" TEXT,
    "changes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HolidayEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HolidayEntry_userId_idx" ON "HolidayEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HolidayEntry_userId_holidayName_year_key" ON "HolidayEntry"("userId", "holidayName", "year");

-- AddForeignKey
ALTER TABLE "HolidayEntry" ADD CONSTRAINT "HolidayEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
