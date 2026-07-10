# USEC Product Specification

## Roles and event lifecycle

- Public players register a complete team or join a tournament-specific solo pool.
- Staff reviews submissions, maintains reusable teams, builds teams from five approved solos, enrolls and seeds entrants, generates competitions, runs veto sessions, and records results.
- Tournaments follow `draft → registration → seeded → live → complete → archived`. Draft events are private; roster and seed changes stop when the bracket is generated.

## Registration and teams

- Every registration belongs to one open tournament and contains normalized roster members. Every player provides an in-game name; only the captain provides an email address.
- Valorant, CS2, and LoL rosters contain five unique students. A student ID, or a provided email, cannot appear twice in an event.
- Team approval creates or links a reusable team and snapshots its roster into the tournament entry.
- Approved solos remain unresolved until staff selects exactly five to create and enroll a team.
- A reusable team may enter multiple tournaments, while each event retains its historical name, seed, and roster snapshot.

## Competition formats

- Single elimination supports arbitrary field sizes and automatically advances byes.
- Double elimination persists winner and loser routes and uses a reset final when the lower-bracket finalist wins the first grand final.
- Round robin schedules every pairing once and ranks by wins, game differential, games won, two-team head-to-head, then seed.
- Swiss generates one round at a time, avoids rematches when possible, rotates byes, and ranks by wins, Buchholz, game differential, then seed. Staff configures 3–7 rounds.

## Matches and veto

- Scores represent terminal series wins: Valorant and CS2 use BO3; LoL uses BO1.
- Correcting a result is allowed until a downstream match starts. Staff can explicitly roll back a result and its downstream assignments when necessary.
- Valorant and CS2 use the BO3 sequence: A ban, B ban, A pick, B pick, A ban, B ban, remaining-map decider.
- Veto state snapshots the map pool, enforces turn order transactionally, and returns the match to scheduled state when complete.

## Security and operations

- Staff uses database-backed, expiring, HTTP-only sessions. API authorization returns structured JSON errors instead of redirects.
- Mutations enforce same-origin requests; staff login is throttled after repeated failures.
- Cloudflare Turnstile is required in production. Local development uses an explicit placeholder token when keys are absent.
- Database failures are surfaced; public reads never substitute fabricated sample data.

## Deferred features

- LoL champion draft, university SSO, granular staff permissions, audit logs, outbound email/Discord notifications, and staff-editable map pools.
