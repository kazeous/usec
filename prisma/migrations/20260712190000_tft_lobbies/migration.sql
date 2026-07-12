ALTER TYPE "Game" ADD VALUE 'tft';
ALTER TYPE "TournamentFormat" ADD VALUE 'tft_lobby';

CREATE TYPE "TftFinalMode" AS ENUM ('fixed_games', 'checkmate');
CREATE TYPE "TftStageStatus" AS ENUM ('pending', 'active', 'complete');

ALTER TABLE "Tournament" ADD COLUMN "tftFinalMode" "TftFinalMode";

CREATE TABLE "TftStage" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "gameLimit" INTEGER NOT NULL,
    "status" "TftStageStatus" NOT NULL DEFAULT 'pending',
    "winnerEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TftStage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TftLobby" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TftLobby_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TftStageEntry" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "lobbyId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "stageSeed" INTEGER NOT NULL,
    "advanced" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TftStageEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TftGame" (
    "id" TEXT NOT NULL,
    "lobbyId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TftGame_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TftGameResult" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "placement" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TftGameResult_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TftGameResult_placement_check" CHECK ("placement" BETWEEN 1 AND 8),
    CONSTRAINT "TftGameResult_points_check" CHECK ("points" BETWEEN 1 AND 8)
);

CREATE UNIQUE INDEX "TftStage_tournamentId_sequence_key" ON "TftStage"("tournamentId", "sequence");
CREATE INDEX "TftStage_tournamentId_status_idx" ON "TftStage"("tournamentId", "status");
CREATE UNIQUE INDEX "TftLobby_stageId_number_key" ON "TftLobby"("stageId", "number");
CREATE UNIQUE INDEX "TftStageEntry_stageId_entryId_key" ON "TftStageEntry"("stageId", "entryId");
CREATE UNIQUE INDEX "TftStageEntry_lobbyId_stageSeed_key" ON "TftStageEntry"("lobbyId", "stageSeed");
CREATE INDEX "TftStageEntry_lobbyId_idx" ON "TftStageEntry"("lobbyId");
CREATE UNIQUE INDEX "TftGame_lobbyId_number_key" ON "TftGame"("lobbyId", "number");
CREATE UNIQUE INDEX "TftGameResult_gameId_entryId_key" ON "TftGameResult"("gameId", "entryId");
CREATE UNIQUE INDEX "TftGameResult_gameId_placement_key" ON "TftGameResult"("gameId", "placement");
CREATE INDEX "TftGameResult_entryId_idx" ON "TftGameResult"("entryId");

ALTER TABLE "TftStage" ADD CONSTRAINT "TftStage_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TftStage" ADD CONSTRAINT "TftStage_winnerEntryId_fkey" FOREIGN KEY ("winnerEntryId") REFERENCES "TournamentEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TftLobby" ADD CONSTRAINT "TftLobby_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "TftStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TftStageEntry" ADD CONSTRAINT "TftStageEntry_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "TftStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TftStageEntry" ADD CONSTRAINT "TftStageEntry_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "TftLobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TftStageEntry" ADD CONSTRAINT "TftStageEntry_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "TournamentEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TftGame" ADD CONSTRAINT "TftGame_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "TftLobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TftGameResult" ADD CONSTRAINT "TftGameResult_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "TftGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TftGameResult" ADD CONSTRAINT "TftGameResult_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "TournamentEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
