CREATE TYPE "AccountStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "StaffReviewAction" AS ENUM ('approved', 'rejected');

ALTER TABLE "User"
ADD COLUMN "accountStatus" "AccountStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN "studentId" TEXT,
ADD COLUMN "universityName" TEXT,
ADD COLUMN "applicationReason" TEXT,
ADD COLUMN "applicationSubmittedAt" TIMESTAMP(3);

UPDATE "User" SET "accountStatus" = 'approved';

CREATE TABLE "StaffAccountReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "action" "StaffReviewAction" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffAccountReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");
CREATE INDEX "User_role_accountStatus_applicationSubmittedAt_idx" ON "User"("role", "accountStatus", "applicationSubmittedAt");
CREATE INDEX "StaffAccountReview_userId_createdAt_idx" ON "StaffAccountReview"("userId", "createdAt");
CREATE INDEX "StaffAccountReview_reviewerUserId_idx" ON "StaffAccountReview"("reviewerUserId");

ALTER TABLE "StaffAccountReview" ADD CONSTRAINT "StaffAccountReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffAccountReview" ADD CONSTRAINT "StaffAccountReview_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
