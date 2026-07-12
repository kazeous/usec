import { z } from "zod";
import { gameConfigs } from "@/lib/game-config";
import { games, registrationModes, type Game, type RegistrationMemberInput, type TeammateInput } from "@/lib/types";

export const staffApplicationSchema = z.object({
  name: z.string().trim().min(2, "Full name is required.").max(100),
  email: z.string().trim().email("Valid email is required.").transform((value) => value.toLowerCase()),
  studentId: z.string().trim().min(2, "Student ID is required.").max(50).transform((value) => value.toUpperCase()),
  universityName: z.string().trim().min(2, "University name is required.").max(150),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72, "Password must be no more than 72 characters."),
  applicationReason: z.string().trim().min(10, "Please provide a short reason for applying.").max(500),
  captchaToken: z.string().trim().optional()
});

export type StaffApplicationInput = z.infer<typeof staffApplicationSchema>;

export const registrationMemberSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(100),
  inGameName: z.string().trim().min(2, "In-game name is required.").max(100),
  studentId: z.string().trim().min(2, "Student ID is required.").max(50).transform((value) => value.toUpperCase()),
  universityName: z.string().trim().min(2, "University name is required.").max(150),
  email: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().email("Enter a valid captain email.").transform((value) => value.toLowerCase()).optional()
  ),
  discord: z.string().trim().max(100).optional(),
  isCaptain: z.boolean().default(false),
  isReserve: z.boolean().default(false)
});

export const teammateSchema = registrationMemberSchema.omit({ isCaptain: true });

export const registrationSchema = z
  .object({
    tournamentId: z.string().min(1, "Tournament is required."),
    game: z.enum(games),
    mode: z.enum(registrationModes),
    teamName: z.string().trim().max(100).optional(),
    members: z.array(registrationMemberSchema).min(1),
    captchaToken: z.string().trim().optional()
  })
  .superRefine((value, context) => {
    const requiredTeamSize = gameConfigs[value.game].teamSize;
    const maxTeamSize = requiredTeamSize + gameConfigs[value.game].maxReservePlayers;
    const invalidRosterSize = value.mode === "team"
      ? value.members.length < requiredTeamSize || value.members.length > maxTeamSize
      : value.members.length !== 1;
    if (invalidRosterSize) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["members"],
        message: value.mode === "team" ? `${gameConfigs[value.game].label} teams need ${requiredTeamSize} main players and may include up to ${gameConfigs[value.game].maxReservePlayers} reserves.` : "Solo registration must contain one player."
      });
    }
    if (value.mode === "team" && (!value.teamName || value.teamName.length < 2)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["teamName"], message: "Team name is required for team registration." });
    }
    if (value.members.filter((member) => member.isCaptain).length !== 1) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["members"], message: "Exactly one roster member must be the captain." });
    }
    const captainIndex = value.members.findIndex((member) => member.isCaptain);
    if (captainIndex >= 0 && !value.members[captainIndex].email) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["members", captainIndex, "email"], message: "Captain email is required." });
    }
    if (captainIndex >= 0 && value.members[captainIndex].isReserve) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["members", captainIndex, "isReserve"], message: "The captain must be on the main roster." });
    }
    const reserveCount = value.members.filter((member) => member.isReserve).length;
    const expectedReserveCount = value.mode === "team" ? Math.max(0, value.members.length - requiredTeamSize) : 0;
    if (reserveCount !== expectedReserveCount) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["members"], message: `Exactly ${requiredTeamSize} players must be marked as the main roster.` });
    }
    const studentIds = value.members.map((member) => member.studentId.toLowerCase());
    const emails = value.members.flatMap((member) => member.email ? [member.email.toLowerCase()] : []);
    if (new Set(studentIds).size !== studentIds.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["members"], message: "Student IDs must be unique within the roster." });
    }
    if (new Set(emails).size !== emails.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["members"], message: "Email addresses must be unique within the roster." });
    }
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;

export function validateTeamSize(game: Game, teammates: TeammateInput[], includesCaptain = true) {
  const requiredTeamSize = gameConfigs[game].teamSize;
  const count = teammates.length + (includesCaptain ? 1 : 0);
  return { valid: count === requiredTeamSize, count, requiredTeamSize };
}

export function normalizeRegistrationPayload(payload: unknown) {
  return registrationSchema.parse(payload);
}

export function registrationMembersFromLegacy(input: {
  fullName: string;
  studentId: string;
  universityName: string;
  email: string;
  inGameName: string;
  discord?: string;
  teammates?: TeammateInput[];
}): RegistrationMemberInput[] {
  return [
    {
      fullName: input.fullName,
      studentId: input.studentId,
      universityName: input.universityName,
      inGameName: input.inGameName,
      email: input.email,
      discord: input.discord,
      isCaptain: true,
      isReserve: false
    },
    ...(input.teammates ?? []).map((member) => ({ ...member, isCaptain: false }))
  ];
}
