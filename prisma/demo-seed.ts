import { PrismaClient, type Game, type TournamentFormat } from "@prisma/client";
import { generateTournamentCompetition } from "../src/lib/tournaments/service";

const prisma = new PrismaClient();
const specs: Array<{ game: Game; format: TournamentFormat; title: string; teams: string[] }> = [
  { game: "valorant", format: "single_elimination", title: "USEC Valorant Demo Cup", teams: ["Dragonline", "Pixel Surge", "Campus Clutch", "Redline Academy", "Neon Lecture", "Bind Bandits", "Library Aimers", "Finals Week"] },
  { game: "cs2", format: "double_elimination", title: "USEC CS2 Demo Bracket", teams: ["Dust Scholars", "Eco Round", "Nuke Notes", "Mirage Majors"] },
  { game: "lol", format: "round_robin", title: "USEC LoL Round Robin", teams: ["Baron Lab", "Dragon Tutors", "Midterm Macro", "Herald Hall"] },
  { game: "valorant", format: "swiss", title: "USEC Valorant Swiss", teams: ["Neon Notes", "Lotus Lab", "Ascent Academy", "Haven Hall"] }
];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  await prisma.tournament.deleteMany({ where: { id: { startsWith: "demo-tournament-" } } });
  await prisma.team.deleteMany({ where: { id: { startsWith: "demo-team-" } } });

  for (const spec of specs) {
    const tournamentId = `demo-tournament-${spec.game}-${spec.format}`;
    await prisma.tournament.create({
      data: {
        id: tournamentId,
        title: spec.title,
        game: spec.game,
        format: spec.format,
        status: "draft",
        registrationOpen: false,
        swissRounds: spec.format === "swiss" ? 3 : null
      }
    });
    for (const [index, name] of spec.teams.entries()) {
      const teamId = `demo-team-${spec.game}-${spec.format}-${index + 1}`;
      const players = Array.from({ length: 5 }, (_, playerIndex) => ({
        fullName: `${name} Player ${playerIndex + 1}`,
        studentId: `${slug(name).slice(0, 8)}-${playerIndex + 1}`,
        universityName: "HCMUS",
        email: `${slug(name)}-${playerIndex + 1}@demo.usec.local`,
        discord: `${slug(name)}-${playerIndex + 1}`,
        isCaptain: playerIndex === 0
      }));
      const team = await prisma.team.create({ data: { id: teamId, game: spec.game, name, players: { create: players } }, include: { players: true } });
      await prisma.tournamentEntry.create({
        data: {
          tournamentId,
          teamId,
          displayName: name,
          seed: index + 1,
          players: {
            create: team.players.map((player) => ({
              playerId: player.id,
              fullName: player.fullName,
              studentId: player.studentId,
              universityName: player.universityName,
              email: player.email,
              discord: player.discord,
              isCaptain: player.isCaptain
            }))
          }
        }
      });
    }
    await generateTournamentCompetition(tournamentId);
  }
  console.log("Demo tournaments, entries, rosters, and brackets are ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => prisma.$disconnect());
