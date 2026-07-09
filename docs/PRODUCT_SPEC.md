# USEC Product Spec

## Roles

- **Public player:** Registers as a solo player or team captain and views brackets, match pages, and veto progress.
- **Staff:** Opens/closes registration, reviews submissions, creates tournaments, generates brackets, starts veto sessions, and records scores.
- **Admin:** Same as staff in v1. Future releases can add staff account management and audit controls.

## Supported Games

- **Valorant:** Five-player teams, map veto enabled, default best-of-three.
- **CS2:** Five-player teams, map veto enabled, default best-of-three.
- **LoL:** Five-player teams, score/bracket tracking only in v1. Champion draft is reserved for a future release.

Map pools are configurable in code for v1 and should be promoted to staff-editable settings later because live map pools change over time.

## Registration

The public registration form captures:

- Game.
- Register as solo player or team.
- Student ID.
- University name.
- Full name.
- Email.
- Discord/contact handle.
- Team name for team registration.
- Teammate full name, student ID, university name, email, and contact handle.
- Cloudflare Turnstile captcha token.

Rules:

- Staff can open or close registration by game.
- Closed games reject public submissions.
- Team registration must include exactly five total players for Valorant, CS2, and LoL.
- Solo registration cannot include teammates.
- All registrations start as `pending`.
- Staff can approve or reject submissions.

## Tournament Formats

- **Single elimination:** Generates seeded winners bracket and final.
- **Double elimination:** Generates winners bracket, losers bracket placeholders, and finals match.
- **Round robin:** Generates each unique team pairing once.
- **Swiss:** Generates current-round pairings by points while avoiding rematches when possible.

Bracket generation uses approved teams for the selected game. Staff can regenerate before the event is locked.

## Match Flow

- Public match pages show teams, score, winner, status, and veto link.
- Staff match pages allow score entry.
- A non-tied score marks the match complete and advances the winner into the next bracket slot where available.
- More complete advancement rules for double elimination, Swiss standings, and round robin tables should be added before large events.

## Map Veto

- Veto is available for Valorant and CS2.
- Staff starts a veto session from a match page.
- V1 uses a best-of-three sequence:
  - Team A ban.
  - Team B ban.
  - Team A pick.
  - Team B pick.
  - Team A ban.
  - Team B ban.
  - Remaining map becomes decider.
- Public veto page polls the API for updates.
- LoL does not use map veto.

## Cloudflare Turnstile

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` stores the public site key and is safe to expose to the browser.
- `TURNSTILE_SECRET_KEY` stores the server-only secret key and must never be exposed publicly.
- Production registration rejects submissions when `TURNSTILE_SECRET_KEY` is missing.
- Local development falls back to a placeholder when Turnstile keys are not configured.

## Future Features

- LoL champion draft:
  - Use the existing `ChampionDraft` model.
  - Add side selection, pick/ban turn order, champion catalog import, and public draft viewer.
- University SSO:
  - Replace app-local login after identity provider details are known.
- Captcha operations:
  - Add staff-visible captcha health checks and spam-rate monitoring.
- Staff permissions:
  - Add granular roles, audit logs, and account management.
- Tournament polish:
  - Seeding editor.
  - Bracket lock.
  - CSV export.
  - Full double-elimination advancement.
  - Swiss standings and tiebreakers.
  - Round robin table view.
