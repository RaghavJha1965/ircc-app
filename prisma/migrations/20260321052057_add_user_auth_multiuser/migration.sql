/*
  Warnings:

  - Added the required column `userId` to the `CrsProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Settings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CrsProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
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
    "nocCode" TEXT,
    "nocTeerCategory" TEXT,
    "preferredProvinces" TEXT,
    "ieltsTestDate" DATETIME,
    "medicalExamDate" DATETIME,
    "policeClearanceDate" DATETIME,
    "ecaIssueDate" DATETIME,
    "irccProfileCreatedDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CrsProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CrsProfile" ("age", "canadianEducation", "canadianWorkYears", "createdAt", "ecaIssueDate", "educationLevel", "firstLanguageScores", "firstLanguageTest", "foreignWorkYears", "frenchAbility", "hasSpouse", "id", "ieltsTestDate", "irccProfileCreatedDate", "jobOffer", "medicalExamDate", "nocCode", "nocTeerCategory", "policeClearanceDate", "preferredProvinces", "provincialNomination", "secondLanguageScores", "sibling", "spouseCanadianWork", "spouseEducation", "spouseLanguageScores", "updatedAt") SELECT "age", "canadianEducation", "canadianWorkYears", "createdAt", "ecaIssueDate", "educationLevel", "firstLanguageScores", "firstLanguageTest", "foreignWorkYears", "frenchAbility", "hasSpouse", "id", "ieltsTestDate", "irccProfileCreatedDate", "jobOffer", "medicalExamDate", "nocCode", "nocTeerCategory", "policeClearanceDate", "preferredProvinces", "provincialNomination", "secondLanguageScores", "sibling", "spouseCanadianWork", "spouseEducation", "spouseLanguageScores", "updatedAt" FROM "CrsProfile";
DROP TABLE "CrsProfile";
ALTER TABLE "new_CrsProfile" RENAME TO "CrsProfile";
CREATE UNIQUE INDEX "CrsProfile_userId_key" ON "CrsProfile"("userId");
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("category", "createdAt", "description", "dueDate", "id", "isCompleted", "name", "notes", "updatedAt") SELECT "category", "createdAt", "description", "dueDate", "id", "isCompleted", "name", "notes", "updatedAt" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "telegramBotToken" TEXT,
    "telegramChatId" TEXT,
    "emailAddress" TEXT,
    "crsAlertThreshold" INTEGER NOT NULL DEFAULT 500,
    "enableTelegram" BOOLEAN NOT NULL DEFAULT false,
    "enableEmail" BOOLEAN NOT NULL DEFAULT true,
    "enableDrawAlerts" BOOLEAN NOT NULL DEFAULT true,
    "enablePnpAlerts" BOOLEAN NOT NULL DEFAULT true,
    "enableNewsAlerts" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Settings" ("crsAlertThreshold", "emailAddress", "enableDrawAlerts", "enableEmail", "enableNewsAlerts", "enablePnpAlerts", "enableTelegram", "id", "telegramBotToken", "telegramChatId") SELECT "crsAlertThreshold", "emailAddress", "enableDrawAlerts", "enableEmail", "enableNewsAlerts", "enablePnpAlerts", "enableTelegram", "id", "telegramBotToken", "telegramChatId" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
