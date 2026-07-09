# USEC Project Plan

## Summary

USEC is a full-stack tournament platform for a university esports club. The first release supports public player/team registration, staff-controlled registration windows, bracket generation, public bracket viewing, score updates, and map veto sessions for Valorant and CS2. LoL champion draft is intentionally left as a future feature with a reserved database model.

## Architecture

- **Frontend:** Next.js App Router, TypeScript, Tailwind CSS, and server/client components.
- **Backend:** Next.js route handlers for auth, registration, staff operations, bracket generation, match scoring, and veto actions.
- **Database:** PostgreSQL through Prisma.
- **Auth:** App-local staff accounts with email/password, bcrypt password hashing, and database-backed session cookies.
- **Domain logic:** Pure TypeScript modules under `src/lib` for validation, game configuration, bracket generation, and map veto state.

## Milestones

1. **Foundation**
   - Scaffold Next.js, Tailwind, Prisma, Vitest, and app shell.
   - Define models for staff users, sessions, registrations, teams, players, tournaments, matches, veto sessions, veto actions, registration settings, and future champion drafts.
2. **Registration**
   - Public form captures student ID, university name, contact details, game, solo/team mode, team name, and teammate roster.
   - Staff can open/close registration per game.
   - Captcha is a provider-neutral placeholder with backend verification stub.
3. **Staff Operations**
   - Staff login and protected dashboard.
   - Registration review and approve/reject actions.
   - Tournament creation and bracket generation from approved teams.
4. **Competition Flow**
   - Public tournament and match pages.
   - Staff score updates advance single-elimination style next-round slots.
   - Valorant/CS2 map veto sessions with polling-based public viewer.
5. **Hardening**
   - Add university SSO only if the school identity provider is known.
   - Replace captcha placeholder with chosen provider.
   - Expand bracket advancement for double elimination, Swiss standings, and full round robin tables.

## Data Flow

1. Public user submits `/register`.
2. API validates the roster and confirms registration is open for the selected game.
3. Staff reviews registrations in `/staff/registrations`.
4. Approved registrations create teams and players.
5. Staff creates a tournament and generates a bracket from approved teams for that game.
6. Public users view brackets through `/tournaments/[id]`.
7. Staff updates match scores and starts map veto sessions where applicable.
8. Veto viewers refresh through polling on `/matches/[id]/veto`.

## Testing

- Unit tests cover registration validation, team size rules, bracket generation, Swiss pairing behavior, and veto turn order.
- Integration-ready route handlers are separated from pure logic so API tests can be added after database test infrastructure is chosen.
- Before production, run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Deployment Notes

- Target any Node-compatible host with PostgreSQL, such as Vercel plus a managed Postgres provider.
- Required environment variables:
  - `DATABASE_URL`
  - `SESSION_SECRET`
  - `NEXT_PUBLIC_APP_NAME`
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  - `TURNSTILE_SECRET_KEY`
- Run `npm run db:push` or formal Prisma migrations before launch.
- Run `npm run db:seed` once to create the initial admin, then change the seeded password.
