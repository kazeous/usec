import { Prisma, type StaffReviewAction } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import type { StaffApplicationInput } from "@/lib/validation";

export async function submitStaffApplication(input: StaffApplicationInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  const studentIdOwner = await prisma.user.findUnique({ where: { studentId: input.studentId }, select: { id: true } });

  if (studentIdOwner && studentIdOwner.id !== existing?.id) {
    throw new ApiError("That student ID is already associated with an account.", 409, "duplicate_student_id");
  }

  if (existing) {
    if (existing.role !== "staff" || existing.accountStatus === "approved") {
      throw new ApiError("An account already exists for that email.", 409, "account_exists");
    }
    if (existing.accountStatus === "pending") {
      throw new ApiError("That staff application is already waiting for approval.", 409, "application_pending");
    }
    if (!(await bcrypt.compare(input.password, existing.passwordHash))) {
      throw new ApiError("The email or password does not match the rejected application.", 401, "invalid_credentials");
    }

    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        studentId: input.studentId,
        universityName: input.universityName,
        applicationReason: input.applicationReason,
        applicationSubmittedAt: new Date(),
        accountStatus: "pending"
      },
      select: { id: true, accountStatus: true }
    });
  }

  try {
    const passwordHash = await bcrypt.hash(input.password, 12);
    return await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        studentId: input.studentId,
        universityName: input.universityName,
        passwordHash,
        applicationReason: input.applicationReason,
        applicationSubmittedAt: new Date(),
        role: "staff",
        accountStatus: "pending"
      },
      select: { id: true, accountStatus: true }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("An application already uses that email or student ID.", 409, "duplicate_application");
    }
    throw error;
  }
}

export async function reviewStaffApplication(input: {
  userId: string;
  reviewerUserId: string;
  action: StaffReviewAction;
  note?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: { id: input.userId, role: "staff", accountStatus: "pending" },
      data: { accountStatus: input.action }
    });
    if (updated.count !== 1) {
      throw new ApiError("Only pending staff applications can be reviewed.", 409, "invalid_account_state");
    }

    const review = await tx.staffAccountReview.create({
      data: {
        userId: input.userId,
        reviewerUserId: input.reviewerUserId,
        action: input.action,
        note: input.note || null
      }
    });
    if (input.action === "rejected") {
      await tx.session.deleteMany({ where: { userId: input.userId } });
    }

    return review;
  });
}

export async function getStaffApplications() {
  return prisma.user.findMany({
    where: { role: "staff", accountStatus: { in: ["pending", "rejected"] } },
    select: {
      id: true,
      name: true,
      email: true,
      studentId: true,
      universityName: true,
      applicationReason: true,
      applicationSubmittedAt: true,
      accountStatus: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          note: true,
          createdAt: true,
          reviewer: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: [{ accountStatus: "asc" }, { applicationSubmittedAt: "desc" }]
  });
}
