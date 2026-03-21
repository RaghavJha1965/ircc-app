-- CreateTable
CREATE TABLE "Draw" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drawNumber" INTEGER NOT NULL,
    "drawDate" DATETIME NOT NULL,
    "drawName" TEXT NOT NULL,
    "crsScore" INTEGER NOT NULL,
    "itasIssued" INTEGER NOT NULL,
    "tieBreakDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PnpDraw" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "province" TEXT NOT NULL,
    "stream" TEXT NOT NULL,
    "drawDate" DATETIME NOT NULL,
    "minScore" INTEGER,
    "itasIssued" INTEGER,
    "nocCodes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "url" TEXT NOT NULL,
    "publishDate" DATETIME NOT NULL,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "telegramBotToken" TEXT,
    "telegramChatId" TEXT,
    "emailAddress" TEXT,
    "crsAlertThreshold" INTEGER NOT NULL DEFAULT 500,
    "enableTelegram" BOOLEAN NOT NULL DEFAULT false,
    "enableEmail" BOOLEAN NOT NULL DEFAULT false,
    "enableDrawAlerts" BOOLEAN NOT NULL DEFAULT true,
    "enablePnpAlerts" BOOLEAN NOT NULL DEFAULT true,
    "enableNewsAlerts" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "CrsProfile" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "age" INTEGER NOT NULL DEFAULT 25,
    "educationLevel" TEXT NOT NULL DEFAULT 'bachelors',
    "firstLanguageTest" TEXT NOT NULL DEFAULT 'ielts',
    "firstLanguageScores" TEXT NOT NULL DEFAULT '{}',
    "secondLanguageScores" TEXT,
    "canadianWorkYears" INTEGER NOT NULL DEFAULT 0,
    "foreignWorkYears" INTEGER NOT NULL DEFAULT 0,
    "hasSpouse" BOOLEAN NOT NULL DEFAULT false,
    "spouseEducation" TEXT,
    "spouseLanguageScores" TEXT,
    "spouseCanadianWork" INTEGER NOT NULL DEFAULT 0,
    "provincialNomination" BOOLEAN NOT NULL DEFAULT false,
    "jobOffer" TEXT,
    "canadianEducation" TEXT,
    "frenchAbility" TEXT,
    "sibling" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProcessingTime" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programName" TEXT NOT NULL,
    "processingDays" INTEGER NOT NULL,
    "lastUpdated" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Draw_drawNumber_key" ON "Draw"("drawNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingTime_programName_key" ON "ProcessingTime"("programName");
