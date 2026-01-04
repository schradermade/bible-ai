-- CreateTable
CREATE TABLE "SavedAiResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "reference" TEXT,
    "prompt" TEXT,
    "response" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedAiResponse_pkey" PRIMARY KEY ("id")
);
