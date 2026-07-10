ALTER TABLE "RegistrationMember" ADD COLUMN "inGameName" TEXT;
ALTER TABLE "Player" ADD COLUMN "inGameName" TEXT;
ALTER TABLE "TournamentEntryPlayer" ADD COLUMN "inGameName" TEXT;

UPDATE "RegistrationMember" SET "inGameName" = "fullName" WHERE "inGameName" IS NULL;
UPDATE "Player" SET "inGameName" = "fullName" WHERE "inGameName" IS NULL;
UPDATE "TournamentEntryPlayer" SET "inGameName" = "fullName" WHERE "inGameName" IS NULL;

ALTER TABLE "RegistrationMember" ALTER COLUMN "inGameName" SET NOT NULL;
ALTER TABLE "Player" ALTER COLUMN "inGameName" SET NOT NULL;
ALTER TABLE "TournamentEntryPlayer" ALTER COLUMN "inGameName" SET NOT NULL;

ALTER TABLE "RegistrationMember" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "Player" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "TournamentEntryPlayer" ALTER COLUMN "email" DROP NOT NULL;
