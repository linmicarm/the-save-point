-- CreateTable
CREATE TABLE "Letter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "openOn" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Letter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommonplaceEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "source" TEXT,
    "tags" TEXT[],
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommonplaceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "emoji" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NowEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "focus" TEXT,
    "building" TEXT,
    "learning" TEXT,
    "feeling" TEXT,
    "location" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NowEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "emoji" TEXT,
    "year" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapsuleEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "photoUrl" TEXT,
    "openOn" TIMESTAMP(3) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapsuleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Letter_userId_idx" ON "Letter"("userId");

-- CreateIndex
CREATE INDEX "CommonplaceEntry_userId_idx" ON "CommonplaceEntry"("userId");

-- CreateIndex
CREATE INDEX "Milestone_userId_idx" ON "Milestone"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NowEntry_userId_key" ON "NowEntry"("userId");

-- CreateIndex
CREATE INDEX "Place_userId_idx" ON "Place"("userId");

-- CreateIndex
CREATE INDEX "CapsuleEntry_userId_idx" ON "CapsuleEntry"("userId");

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommonplaceEntry" ADD CONSTRAINT "CommonplaceEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NowEntry" ADD CONSTRAINT "NowEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapsuleEntry" ADD CONSTRAINT "CapsuleEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
