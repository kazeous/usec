# USEC Tournament Hub Progress

> Reconstructed on 2026-07-12 from the repository contents and git history because the required progress file was missing.

## Active phase

Teamfight Tactics staged-lobby tournament support.

## Completed baseline

- Public tournament discovery, registration, and tournament detail views.
- Staff authentication, account approval, tournament lifecycle, registration review, reusable teams, solo-team assembly, and entrant seeding.
- Single-elimination, double-elimination, round-robin, and Swiss competition generation and scoring.
- Valorant and CS2 map veto flows; LoL is supported without champion draft.
- Reserve rosters, captain-only email collection, and in-game names.
- PostgreSQL Prisma migrations, base/demo seeds, and Coolify migration deployment.
- Unit, integration, typecheck, lint, and production-build verification were passing before this phase began.

## Current work

- Add TFT as a solo-only game with eight-player staged lobbies.
- Add placement scoring, top-four advancement, snake seeding, fixed-game finals, and checkmate finals.
- Add staff result entry and public lobby standings without changing head-to-head bracket behavior.

## Next session starts here

Continue the TFT phase from the first incomplete item above. Read the actual repository and this file before making changes.
