# USEC Architecture

## Data model

- `Registration` and `RegistrationMember` preserve submitted event rosters.
- `Team` and `Player` form the reusable staff directory.
- `TournamentEntry` and `TournamentEntryPlayer` snapshot the event name, seed, and roster.
- `MatchFeed` persists winner/loser advancement into an explicit target slot.
- `VetoSession` snapshots the map pool and owns ordered, conflict-protected actions.

## Service boundaries

- Registration services review submissions, link or create teams, assemble solos, validate roster conflicts, and enroll reusable teams transactionally.
- Competition services generate formats, propagate byes and match outcomes, validate terminal series scores, produce Swiss rounds, and roll back downstream state.
- Data readers map database entries and matches into public views and derive Swiss/round-robin standings without demo fallbacks.
- Route handlers provide consistent validation, authentication, conflict, and service-error responses.

## Verification

- Pure unit tests cover registration identity rules, bracket topology, byes, Swiss pairings, standings, terminal scores, veto order, and Turnstile reset behavior.
- Database integration tests cover solo-team assembly, reusable enrollment, bracket generation, advancement, completion, regeneration locks, rollback, and corrected results.
- The production build, lint, typecheck, migration reset, base seed, demo seed, and local browser acceptance flows must all pass before release.
