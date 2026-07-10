# USEC

University esports tournament platform with event registration, reusable team rosters, staff-built solo teams, seeded brackets, standings, match scoring, and map veto.

## Stack

- Next.js App Router, React, TypeScript, and Tailwind CSS
- PostgreSQL and Prisma
- Vitest

## Local setup

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL locally or run `docker-compose up -d`.
3. Install and initialize the app:

   ```bash
   npm install
   npm run db:push
   npm run db:seed
   npm run db:demo
   npm run dev
   ```

The seed creates `admin@usec.local` with password `ChangeMe123!`. Change it before deployment.

## Core workflow

1. Staff creates a tournament and moves it from draft to registration.
2. Players submit a team or solo registration for that tournament.
3. Staff approves team rosters, links reusable teams, or combines five approved solos.
4. Staff enrolls and seeds confirmed entries, then generates single elimination, double elimination, round robin, or the first Swiss round.
5. Staff records terminal series results. Elimination outcomes follow persisted winner/loser routes; round-robin and Swiss results update standings.
6. Swiss events generate each later round only after the previous round completes. Valorant and CS2 matches can run the BO3 map veto flow.

## Verification

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Coolify deployment

The production start command runs `prisma migrate deploy` before starting Next.js. Keep the repository's default `npm run start` command in Coolify and provide `DATABASE_URL` to both the build and runtime environments.

For an existing disposable development database that predates the checked-in migration, run this once from the application terminal before redeploying:

```bash
npx prisma migrate reset --force
```

This deletes the existing schema, applies every migration, records the migration history, and runs the base seed. Never run this reset command against a database whose data must be preserved.
