import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  pending: "border-[#d8a531] bg-[#fff4d5] text-[#6d4a00]",
  approved: "border-[#56b68b] bg-[#e6f7ef] text-[#17613f]",
  rejected: "border-[#e74d3d] bg-[#ffe5e1] text-[#8f2016]",
  scheduled: "border-[#335cba] bg-[#e6edff] text-[#17366d]",
  live: "border-[#e74d3d] bg-[#ffe5e1] text-[#8f2016]",
  complete: "border-[#56b68b] bg-[#e6f7ef] text-[#17613f]",
  registration: "border-[#335cba] bg-[#e6edff] text-[#17366d]"
};

export function StatusPill({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold capitalize",
        tones[value] ?? "border-[#cfc6b8] bg-[#fffdf8] text-[#514c45]"
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
