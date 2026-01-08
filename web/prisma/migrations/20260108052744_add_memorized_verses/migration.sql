-- CreateTable
CREATE TABLE "MemorizedVerse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "memorizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemorizedVerse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemorizedVerse_userId_idx" ON "MemorizedVerse"("userId");

-- CreateIndex
CREATE INDEX "MemorizedVerse_memorizedAt_idx" ON "MemorizedVerse"("memorizedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MemorizedVerse_userId_reference_key" ON "MemorizedVerse"("userId", "reference");
