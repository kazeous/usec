import { describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({ user: null as null | { id: string; role: "staff" | "admin" } }));
vi.mock("@/lib/auth", () => ({ getCurrentStaffForApi: vi.fn(async () => authState.user) }));

import { requireAdminApi, requireStaffApi } from "@/lib/http";

const request = new Request("https://usec.example/api/staff/test");

describe("staff API authorization", () => {
  it("returns unauthorized when no approved user is present", async () => {
    authState.user = null;
    await expect(requireStaffApi(request)).rejects.toMatchObject({ status: 401, code: "unauthorized" });
  });

  it("allows staff operations but rejects admin operations", async () => {
    authState.user = { id: "staff-1", role: "staff" };
    await expect(requireStaffApi(request)).resolves.toEqual(authState.user);
    await expect(requireAdminApi(request)).rejects.toMatchObject({ status: 403, code: "forbidden" });
  });

  it("allows an administrator through the admin guard", async () => {
    authState.user = { id: "admin-1", role: "admin" };
    await expect(requireAdminApi(request)).resolves.toEqual(authState.user);
  });
});
