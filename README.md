# USEC

University esports club tournament platform for registrations, brackets, match scores, and map veto sessions.

## Stack

- Next.js App Router
- TypeScript
- PostgreSQL + Prisma
- Tailwind CSS
- Vitest

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set `DATABASE_URL`.

3. Generate Prisma client and migrate the database:

   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

Default seeded staff login:

- Email: `admin@usec.local`
- Password: `ChangeMe123!`

Change this before deploying.
