-- CreateTable
CREATE TABLE "SavedVerse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedVerse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedVerse_userId_idx" ON "SavedVerse"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedVerse_userId_reference_key" ON "SavedVerse"("userId", "reference");
