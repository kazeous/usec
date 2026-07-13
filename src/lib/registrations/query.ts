import { games, type Game, type RegistrationStatus } from "@/lib/types";

export const registrationPageSizes = [10, 20, 50] as const;
export type RegistrationPageSize = (typeof registrationPageSizes)[number];
export type RegistrationStatusFilter = RegistrationStatus | "all";

type QueryValue = string | string[] | undefined;

function first(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseRegistrationListQuery(query: Record<string, QueryValue>) {
  const requestedGame = first(query.game);
  const requestedStatus = first(query.status);
  const requestedPage = Number(first(query.page));
  const requestedPageSize = Number(first(query.pageSize));

  return {
    game: games.includes(requestedGame as Game) ? requestedGame as Game : "all" as const,
    status: ["pending", "approved", "rejected", "all"].includes(requestedStatus ?? "") ? requestedStatus as RegistrationStatusFilter : "pending" as const,
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    pageSize: registrationPageSizes.includes(requestedPageSize as RegistrationPageSize) ? requestedPageSize as RegistrationPageSize : 10
  };
}
