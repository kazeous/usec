import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentStaffForApi } from "@/lib/auth";
import { ApiError } from "@/lib/errors";

export { ApiError } from "@/lib/errors";

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
  const proto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  if (origin !== `${proto}://${host}`) throw new ApiError("Cross-origin mutation rejected.", 403, "invalid_origin");
}

export async function requireStaffApi(request: Request) {
  assertSameOrigin(request);
  const staff = await getCurrentStaffForApi();
  if (!staff) throw new ApiError("Authentication required.", 401, "unauthorized");
  return staff;
}

export async function requireAdminApi(request: Request) {
  const staff = await requireStaffApi(request);
  if (staff.role !== "admin") throw new ApiError("Administrator access required.", 403, "forbidden");
  return staff;
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues.map((issue) => issue.message).join(" "), code: "validation_error", issues: error.flatten() },
      { status: 400 }
    );
  }
  if (error instanceof Error && "status" in error && typeof error.status === "number") {
    return NextResponse.json({ error: error.message, code: error.status === 409 ? "conflict" : "operation_failed" }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "Unexpected server error.", code: "server_error" }, { status: 500 });
}
