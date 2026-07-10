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

1. Prospective staff apply publicly and wait for an administrator to approve their account.
2. Administrators create tournaments, manage entrants and seeds, and generate brackets.
3. Players submit a team or solo registration for a tournament, which approved staff can review.
4. Approved staff run match-day scoring and veto operations; administrators retain all staff capabilities.
5. Elimination outcomes follow persisted winner/loser routes; round-robin and Swiss results update standings.
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
