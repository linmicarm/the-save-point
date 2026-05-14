-- CreateTable
CREATE TABLE "WishItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WishItem_userId_idx" ON "WishItem"("userId");

-- AddForeignKey
ALTER TABLE "WishItem" ADD CONSTRAINT "WishItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
