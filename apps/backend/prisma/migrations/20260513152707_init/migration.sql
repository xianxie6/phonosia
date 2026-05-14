-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "ageGrade" SMALLINT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "parentPinHash" TEXT NOT NULL,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spirit" (
    "id" INTEGER NOT NULL,
    "word" TEXT NOT NULL,
    "islandId" SMALLINT NOT NULL,
    "theme" TEXT NOT NULL,
    "difficulty" SMALLINT NOT NULL,
    "phonetic" TEXT NOT NULL,
    "meaningZh" TEXT NOT NULL,
    "exampleSentence" TEXT NOT NULL,
    "isBoss" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Spirit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSpirit" (
    "userId" TEXT NOT NULL,
    "spiritId" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bestScore" SMALLINT NOT NULL,
    "captureVersion" TEXT NOT NULL DEFAULT 'standard',
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3),
    "nickname" TEXT,

    CONSTRAINT "UserSpirit_pkey" PRIMARY KEY ("userId","spiritId")
);

-- CreateTable
CREATE TABLE "DailySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionDate" DATE NOT NULL,
    "newWordsCount" INTEGER NOT NULL DEFAULT 0,
    "reviewWordsCount" INTEGER NOT NULL DEFAULT 0,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "totalSuccess" INTEGER NOT NULL DEFAULT 0,
    "sessionDurationSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PronunciationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spiritId" INTEGER NOT NULL,
    "score" SMALLINT NOT NULL,
    "attemptNumber" SMALLINT NOT NULL,
    "audioDurationMs" INTEGER NOT NULL,
    "failureReason" VARCHAR(30),
    "attemptCounted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PronunciationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_parentPhone_key" ON "User"("parentPhone");

-- CreateIndex
CREATE UNIQUE INDEX "DailySession_userId_sessionDate_key" ON "DailySession"("userId", "sessionDate");

-- AddForeignKey
ALTER TABLE "UserSpirit" ADD CONSTRAINT "UserSpirit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSpirit" ADD CONSTRAINT "UserSpirit_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "Spirit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySession" ADD CONSTRAINT "DailySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PronunciationLog" ADD CONSTRAINT "PronunciationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PronunciationLog" ADD CONSTRAINT "PronunciationLog_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "Spirit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
