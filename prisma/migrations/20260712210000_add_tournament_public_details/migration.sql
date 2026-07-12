-- CreateEnum
CREATE TYPE "LocationMode" AS ENUM ('online', 'offline');

-- CreateEnum
CREATE TYPE "ParticipationFormat" AS ENUM ('five_v_five', 'one_v_one', 'tft');

-- AlterTable
ALTER TABLE "Tournament"
ADD COLUMN "locationMode" "LocationMode" NOT NULL DEFAULT 'offline',
ADD COLUMN "participationFormat" "ParticipationFormat" NOT NULL DEFAULT 'five_v_five';

-- Existing TFT events are individual competitions.
UPDATE "Tournament"
SET "participationFormat" = 'tft'
WHERE "game" = 'tft';
