-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('staff', 'admin');

-- CreateEnum
CREATE TYPE "Game" AS ENUM ('valorant', 'cs2', 'lol');

-- CreateEnum
CREATE TYPE "RegistrationMode" AS ENUM ('solo', 'team');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('single_elimination', 'double_elimination', 'round_robin', 'swiss');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('draft', 'registration', 'seeded', 'live', 'complete', 'archived');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('confirmed', 'withdrawn', 'disqualified');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('pending', 'scheduled', 'veto', 'live', 'complete', 'disputed');

-- CreateEnum
CREATE TYPE "BracketSide" AS ENUM ('winners', 'losers', 'finals', 'round_robin', 'swiss');

-- CreateEnum
CREATE TYPE "MatchOutcome" AS ENUM ('winner', 'loser');

-- CreateEnum
CREATE TYPE "MatchSlot" AS ENUM ('team_a', 'team_b');

-- CreateEnum
CREATE TYPE "VetoStatus" AS ENUM ('pending', 'active', 'complete', 'cancelled');

-- CreateEnum
CREATE TYPE "VetoActionType" AS ENUM ('ban', 'pick', 'decider');

-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('planned', 'active', 'complete');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'staff',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "game" "Game" NOT NULL,
    "format" "TournamentFormat" NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'draft',
    "registrationOpen" BOOLEAN NOT NULL DEFAULT false,
    "registrationMessage" TEXT,
    "registrationClosesAt" TIMESTAMP(3),
    "startsAt" TIMESTAMP(3),
    "lockBracketAt" TIMESTAMP(3),
    "swissRounds" INTEGER,
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "game" "Game" NOT NULL,
    "mode" "RegistrationMode" NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'pending',
    "teamName" TEXT,
    "captchaProvider" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolvedTeamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationMember" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "universityName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "discord" TEXT,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "game" "Game" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "universityName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "discord" TEXT,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentEntry" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "seed" INTEGER,
    "status" "EntryStatus" NOT NULL DEFAULT 'confirmed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentEntryPlayer" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "universityName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "discord" TEXT,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TournamentEntryPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "bracket" "BracketSide" NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'pending',
    "bestOf" INTEGER NOT NULL DEFAULT 1,
    "teamAEntryId" TEXT,
    "teamBEntryId" TEXT,
    "winnerEntryId" TEXT,
    "teamAScore" INTEGER NOT NULL DEFAULT 0,
    "teamBScore" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "isBye" BOOLEAN NOT NULL DEFAULT false,
    "isResetFinal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchFeed" (
    "id" TEXT NOT NULL,
    "sourceMatchId" TEXT NOT NULL,
    "outcome" "MatchOutcome" NOT NULL,
    "targetMatchId" TEXT NOT NULL,
    "targetSlot" "MatchSlot" NOT NULL,

    CONSTRAINT "MatchFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VetoSession" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "game" "Game" NOT NULL,
    "status" "VetoStatus" NOT NULL DEFAULT 'pending',
    "mapPool" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VetoSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VetoAction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "actorEntryId" TEXT,
    "action" "VetoActionType" NOT NULL,
    "mapName" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VetoAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChampionDraft" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "status" "DraftStatus" NOT NULL DEFAULT 'planned',
    "state" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChampionDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_key_createdAt_idx" ON "LoginAttempt"("key", "createdAt");

-- CreateIndex
CREATE INDEX "Tournament_status_startsAt_idx" ON "Tournament"("status", "startsAt");

-- CreateIndex
CREATE INDEX "Registration_tournamentId_status_mode_idx" ON "Registration"("tournamentId", "status", "mode");

-- CreateIndex
CREATE INDEX "Registration_resolvedTeamId_idx" ON "Registration"("resolvedTeamId");

-- CreateIndex
CREATE INDEX "RegistrationMember_studentId_idx" ON "RegistrationMember"("studentId");

-- CreateIndex
CREATE INDEX "RegistrationMember_email_idx" ON "RegistrationMember"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationMember_registrationId_studentId_key" ON "RegistrationMember"("registrationId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationMember_registrationId_email_key" ON "RegistrationMember"("registrationId", "email");

-- CreateIndex
CREATE INDEX "Team_game_name_idx" ON "Team"("game", "name");

-- CreateIndex
CREATE INDEX "Player_studentId_idx" ON "Player"("studentId");

-- CreateIndex
CREATE INDEX "Player_email_idx" ON "Player"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Player_teamId_studentId_key" ON "Player"("teamId", "studentId");

-- CreateIndex
CREATE INDEX "TournamentEntry_tournamentId_status_seed_idx" ON "TournamentEntry"("tournamentId", "status", "seed");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentEntry_tournamentId_teamId_key" ON "TournamentEntry"("tournamentId", "teamId");

-- CreateIndex
CREATE INDEX "TournamentEntryPlayer_studentId_idx" ON "TournamentEntryPlayer"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentEntryPlayer_entryId_playerId_key" ON "TournamentEntryPlayer"("entryId", "playerId");

-- CreateIndex
CREATE INDEX "Match_tournamentId_status_idx" ON "Match"("tournamentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Match_tournamentId_bracket_round_position_key" ON "Match"("tournamentId", "bracket", "round", "position");

-- CreateIndex
CREATE UNIQUE INDEX "MatchFeed_sourceMatchId_outcome_key" ON "MatchFeed"("sourceMatchId", "outcome");

-- CreateIndex
CREATE UNIQUE INDEX "MatchFeed_targetMatchId_targetSlot_key" ON "MatchFeed"("targetMatchId", "targetSlot");

-- CreateIndex
CREATE UNIQUE INDEX "VetoSession_matchId_key" ON "VetoSession"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "VetoAction_sessionId_order_key" ON "VetoAction"("sessionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionDraft_matchId_key" ON "ChampionDraft"("matchId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_resolvedTeamId_fkey" FOREIGN KEY ("resolvedTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationMember" ADD CONSTRAINT "RegistrationMember_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentEntry" ADD CONSTRAINT "TournamentEntry_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentEntry" ADD CONSTRAINT "TournamentEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentEntryPlayer" ADD CONSTRAINT "TournamentEntryPlayer_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "TournamentEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentEntryPlayer" ADD CONSTRAINT "TournamentEntryPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamAEntryId_fkey" FOREIGN KEY ("teamAEntryId") REFERENCES "TournamentEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamBEntryId_fkey" FOREIGN KEY ("teamBEntryId") REFERENCES "TournamentEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerEntryId_fkey" FOREIGN KEY ("winnerEntryId") REFERENCES "TournamentEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchFeed" ADD CONSTRAINT "MatchFeed_sourceMatchId_fkey" FOREIGN KEY ("sourceMatchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchFeed" ADD CONSTRAINT "MatchFeed_targetMatchId_fkey" FOREIGN KEY ("targetMatchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetoSession" ADD CONSTRAINT "VetoSession_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetoAction" ADD CONSTRAINT "VetoAction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VetoSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionDraft" ADD CONSTRAINT "ChampionDraft_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
