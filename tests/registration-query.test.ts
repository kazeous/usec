import { describe, expect, it } from "vitest";
import { parseRegistrationListQuery } from "@/lib/registrations/query";

describe("registration list query", () => {
  it("defaults to the first page of ten pending registrations", () => {
    expect(parseRegistrationListQuery({})).toEqual({ game: "all", status: "pending", page: 1, pageSize: 10 });
  });

  it("accepts supported filters and page sizes", () => {
    expect(parseRegistrationListQuery({ game: "tft", status: "approved", page: "3", pageSize: "50" })).toEqual({
      game: "tft",
      status: "approved",
      page: 3,
      pageSize: 50
    });
  });

  it("rejects unsupported and unsafe pagination values", () => {
    expect(parseRegistrationListQuery({ game: "invalid", status: "deleted", page: "-2", pageSize: "1000" })).toEqual({
      game: "all",
      status: "pending",
      page: 1,
      pageSize: 10
    });
  });
});
