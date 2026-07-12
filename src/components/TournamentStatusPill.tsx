import { cn } from "@/lib/utils";

const tones = {
  registration: "border-[#335cba] bg-[#e6edff] text-[#17366d]",
  closed: "border-[#d8a531] bg-[#fff4d5] text-[#6d4a00]",
  ended: "border-[#cfc6b8] bg-[#f0ebe3] text-[#514c45]",
  live: "border-[#e74d3d] bg-[#ffe5e1] text-[#8f2016]",
  default: "border-[#cfc6b8] bg-[#fffdf8] text-[#514c45]"
};

export function getTournamentStatusPresentation(status: string, registrationOpen: boolean) {
  if (status === "complete" || status === "archived") {
    return { label: "Ended", tone: tones.ended };
  }

  if (status === "registration" && !registrationOpen) {
    return { label: "Closed registration", tone: tones.closed };
  }

  if (status === "registration") {
    return { label: "Registration", tone: tones.registration };
  }

  return {
    label: status.replaceAll("_", " "),
    tone: status === "live" ? tones.live : tones.default
  };
}

export function TournamentStatusPill({ status, registrationOpen }: { status: string; registrationOpen: boolean }) {
  const presentation = getTournamentStatusPresentation(status, registrationOpen);

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold capitalize", presentation.tone)}>
      {presentation.label}
    </span>
  );
}
