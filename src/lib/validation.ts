import { z } from "zod";
import { gameConfigs } from "@/lib/game-config";
import { games, registrationModes, type Game, type RegistrationMemberInput, type TeammateInput } from "@/lib/types";

export const registrationMemberSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(100),
  studentId: z.string().trim().min(2, "Student ID is required.").max(50).transform((value) => value.toUpperCase()),
  universityName: z.string().trim().min(2, "University name is required.").max(150),
  email: z.string().trim().email("Valid email is required.").transform((value) => value.toLowerCase()),
  discord: z.string().trim().max(100).optional(),
  isCaptain: z.boolean().default(false)
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
    const expectedSize = value.mode === "team" ? requiredTeamSize : 1;
    if (value.members.length !== expectedSize) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["members"],
        message: value.mode === "team" ? `${gameConfigs[value.game].label} teams need exactly ${requiredTeamSize} players.` : "Solo registration must contain one player."
      });
    }
    if (value.mode === "team" && (!value.teamName || value.teamName.length < 2)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["teamName"], message: "Team name is required for team registration." });
    }
    if (value.members.filter((member) => member.isCaptain).length !== 1) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["members"], message: "Exactly one roster member must be the captain." });
    }
    const studentIds = value.members.map((member) => member.studentId.toLowerCase());
    const emails = value.members.map((member) => member.email.toLowerCase());
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
  discord?: string;
  teammates?: TeammateInput[];
}): RegistrationMemberInput[] {
  return [
    {
      fullName: input.fullName,
      studentId: input.studentId,
      universityName: input.universityName,
      email: input.email,
      discord: input.discord,
      isCaptain: true
    },
    ...(input.teammates ?? []).map((member) => ({ ...member, isCaptain: false }))
  ];
}
