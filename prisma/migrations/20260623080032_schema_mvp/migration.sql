-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('words', 'timed', 'battle', 'drill', 'yolo');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bestWpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bestScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bestAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "typingSounds" BOOLEAN NOT NULL DEFAULT true,
    "achievementSounds" BOOLEAN NOT NULL DEFAULT true,
    "notificationSounds" BOOLEAN NOT NULL DEFAULT true,
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "achievementToasts" BOOLEAN NOT NULL DEFAULT true,
    "animations" BOOLEAN NOT NULL DEFAULT true,
    "fontSize" INTEGER NOT NULL DEFAULT 36,
    "textWidth" TEXT NOT NULL DEFAULT 'wide',
    "caretStyle" TEXT NOT NULL DEFAULT 'line',
    "accentColor" TEXT NOT NULL DEFAULT 'blue',
    "difficulty" TEXT NOT NULL DEFAULT 'easy',

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wpm" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "totalKeystrokes" INTEGER NOT NULL,
    "correctKeystrokes" INTEGER NOT NULL,
    "incorrectKeystrokes" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "wordsCompleted" INTEGER NOT NULL,
    "mode" "SessionMode" NOT NULL,
    "config" JSONB NOT NULL,
    "timeline" JSONB NOT NULL,
    "errorKeys" JSONB,

    CONSTRAINT "SessionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoloProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activeLetter" TEXT,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "totalWordsCompleted" INTEGER NOT NULL DEFAULT 0,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "hasActiveRun" BOOLEAN NOT NULL DEFAULT false,
    "letterProfiles" JSONB NOT NULL,

    CONSTRAINT "YoloProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrillProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyStats" JSONB NOT NULL,
    "bigramStats" JSONB NOT NULL,
    "trigramStats" JSONB NOT NULL,
    "mistakeRecords" JSONB NOT NULL,
    "drillHistory" JSONB NOT NULL,

    CONSTRAINT "DrillProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_bestScore_idx" ON "User"("bestScore" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "SessionResult_userId_timestamp_idx" ON "SessionResult"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "SessionResult_mode_idx" ON "SessionResult"("mode");

-- CreateIndex
CREATE UNIQUE INDEX "YoloProfile_userId_key" ON "YoloProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DrillProfile_userId_key" ON "DrillProfile"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionResult" ADD CONSTRAINT "SessionResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YoloProfile" ADD CONSTRAINT "YoloProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrillProfile" ADD CONSTRAINT "DrillProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
