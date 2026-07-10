import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAdminApi } from "@/lib/http";
import { getStaffApplications, reviewStaffApplication } from "@/lib/staff-accounts";

const reviewSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  reviewNote: z.string().trim().max(500).optional()
});

export async function GET(request: Request) {
  try {
    await requireAdminApi(request);
    return NextResponse.json(await getStaffApplications());
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminApi(request);
    const input = reviewSchema.parse(await request.json());
    const review = await reviewStaffApplication({
      userId: input.userId,
      reviewerUserId: admin.id,
      action: input.action === "approve" ? "approved" : "rejected",
      note: input.reviewNote
    });
    return NextResponse.json(review);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
