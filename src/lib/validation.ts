import { z } from "zod";
import { gameConfigs } from "@/lib/game-config";
import { games, registrationModes, type Game, type TeammateInput } from "@/lib/types";

export const teammateSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  studentId: z.string().min(2, "Student ID is required."),
  universityName: z.string().min(2, "University name is required."),
  email: z.string().email("Valid email is required."),
  discord: z.string().trim().optional()
});

export const registrationSchema = z
  .object({
    game: z.enum(games),
    mode: z.enum(registrationModes),
    studentId: z.string().min(2, "Student ID is required."),
    universityName: z.string().min(2, "University name is required."),
    fullName: z.string().min(2, "Full name is required."),
    email: z.string().email("Valid email is required."),
    discord: z.string().trim().optional(),
    teamName: z.string().trim().optional(),
    teammates: z.array(teammateSchema).default([]),
    captchaToken: z.string().trim().optional()
  })
  .superRefine((value, context) => {
    const requiredTeamSize = gameConfigs[value.game].teamSize;
    const submittedPlayerCount = 1 + value.teammates.length;

    if (value.mode === "team") {
      if (!value.teamName || value.teamName.length < 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["teamName"],
          message: "Team name is required for team registration."
        });
      }

      if (submittedPlayerCount !== requiredTeamSize) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["teammates"],
          message: `${gameConfigs[value.game].label} teams need exactly ${requiredTeamSize} players including the captain.`
        });
      }
    }

    if (value.mode === "solo" && value.teammates.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["teammates"],
        message: "Solo registrations cannot include teammates."
      });
    }
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;

export function validateTeamSize(game: Game, teammates: TeammateInput[], includesCaptain = true) {
  const requiredTeamSize = gameConfigs[game].teamSize;
  const count = teammates.length + (includesCaptain ? 1 : 0);

  return {
    valid: count === requiredTeamSize,
    count,
    requiredTeamSize
  };
}

export function normalizeRegistrationPayload(payload: unknown) {
  return registrationSchema.parse(payload);
}
