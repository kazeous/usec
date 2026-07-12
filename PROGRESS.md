# USEC Tournament Hub Progress

> Reconstructed on 2026-07-12 from the repository contents and git history because the required progress file was missing.

## Active phase

Teamfight Tactics staged-lobby tournament support is implemented. Database migration/integration verification is the only remaining phase check.

## Completed baseline

- Public tournament discovery, registration, and tournament detail views.
- Staff authentication, account approval, tournament lifecycle, registration review, reusable teams, solo-team assembly, and entrant seeding.
- Single-elimination, double-elimination, round-robin, and Swiss competition generation and scoring.
- Valorant and CS2 map veto flows; LoL is supported without champion draft.
- Reserve rosters, captain-only email collection, and in-game names.
- PostgreSQL Prisma migrations, base/demo seeds, and Coolify migration deployment.
- Unit, integration, typecheck, lint, and production-build verification were passing before this phase began.

## Completed in this phase

- Added TFT as a solo-only game and constrained it to the dedicated TFT lobby format.
- Added 8/16/32/64-player staged competitions, eight-player snake-seeded lobbies, four-game top-four cuts, and point resets between stages.
- Added `8/7/6/5/4/3/2/1` placement scoring with deterministic TFT tie-breaks.
- Added fixed six-game finals and 20-point checkmate finals capped at eight games.
- Added transactional eight-placement result entry, corrections, downstream locks/regeneration, and automatic tournament completion.
- Added staff lobby operations, Riot policy warnings for 8/16-player fields, and public lobby standings.
- Added automatic one-player team/entry snapshots when staff approves a TFT registration.
- Added a Prisma migration, unit/UI coverage, and database integration coverage for complete 8/16/32-player flows.
- Updated homepage tournament card to show open registration count and browse button.
- Added public `/guidelines` page and staff dashboard editable guidelines (`/staff/guidelines`) backed by `SiteContent` database model.

## Verification

- `npm test`: passed (43 passed, database integration suite skipped in the unit configuration).
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:integration`: blocked because the configured local PostgreSQL server reports that database `usec` does not exist. The Docker service was started, but database inspection/creation could not be approved in this environment.

## Next session starts here

Provision or select a disposable `usec` PostgreSQL database, run `npm run db:deploy`, then run `npm run test:integration`. Do not reset any database whose data must be preserved. After those checks pass, perform a browser acceptance pass for TFT creation, solo registration approval, lobby scoring, advancement, and the public standings view.
