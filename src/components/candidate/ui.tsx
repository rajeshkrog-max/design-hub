// Small building blocks shared by the candidate views (matches the Sera Arena mock).
import type { ReactNode } from "react";
import { ProgressBar, TONE_BG, TONE_ON, type Tone } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { GapType, RoundKey } from "@/types/arena";

export type View = "dash" | "interview" | "reports" | "resources" | "profile";
export type GoTo = (view: View) => void;

export const ROUND_TONE: Record<RoundKey, Tone> = { screening: "sage", aptitude: "amber", hr_bp: "rose", ceo: "blue" };
export const ROUND_SHORT: Record<RoundKey, string> = { screening: "Screening", aptitude: "Aptitude", hr_bp: "HR BP", ceo: "CEO" };

export const GAP_LABEL: Record<GapType, string> = { skill: "Skill gap", communication: "Communication", expectation: "Expectation", aptitude: "Aptitude" };
export const GAP_TONE: Record<GapType, Tone> = { skill: "rose", communication: "blue", expectation: "amber", aptitude: "sage" };

/** Filled chip in a tone, e.g. the active round number or an interviewer's initials. */
export const toneFill = (tone: Tone) => `${TONE_BG[tone]} ${TONE_ON[tone]}`;

export function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

export function formatClock(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function Card({ title, right, children, className }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("clay rounded-3xl p-5", className)}>
      {(title || right) && (
        <div className="mb-3.5 flex items-center gap-2.5">
          {title && <h3 className="text-[14.5px] font-semibold">{title}</h3>}
          <span className="flex-1" />
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

/** A labelled score bar with the threshold marked, red when below it. */
export function MetricBar({ label, value, needs, tone }: { label: string; value: number; needs: number; tone: Tone }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex justify-between text-[12.5px]">
        <span>{label}</span>
        <span className={cn("tabular-nums", value < needs ? "text-bad" : "text-ink-3")}>{value} · needs {needs}</span>
      </div>
      <ProgressBar value={value} tone={tone} marker={needs} />
    </div>
  );
}

export function DotList({ label, items, dot }: { label: string; items: string[]; dot: "good" | "bad" | "amber" }) {
  if (!items.length) return null;
  const dotClass = { good: "bg-good", bad: "bg-bad", amber: "bg-amber" }[dot];
  return (
    <div>
      <span className="eyebrow">{label}</span>
      <ul className="mt-2 grid gap-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[12.5px] leading-[1.45]">
            <i className={cn("mt-[5px] size-2 shrink-0 rounded-full", dotClass)} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Clay orb: an inset well with a coloured sphere; breathes while a round is live. */
export function Orb({ tone, size = "lg", breathing = false, dim = false }: { tone: Tone; size?: "sm" | "lg"; breathing?: boolean; dim?: boolean }) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full",
        size === "lg" ? "clay aspect-square w-[min(62vw,300px)]" : "clay-inset size-[92px]",
        dim && "opacity-60",
      )}
    >
      <i className={cn("orb-ball aspect-square rounded-full", size === "lg" ? "w-[76%]" : "w-[62px]", TONE_BG[tone], breathing && "orb-breathe motion-reduce:animate-none")} />
    </div>
  );
}

export function Btn({
  children, onClick, variant = "raised", disabled, className, type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "raised" | "primary" | "ghost";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const styles = {
    raised: "bg-panel shadow-raise-sm",
    primary: "bg-primary text-primary-foreground shadow-raise-sm",
    ghost: "bg-transparent text-ink-2",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn("inline-flex items-center justify-center gap-2 rounded-[13px] px-4 py-2.5 font-medium disabled:cursor-default disabled:opacity-50 [&_svg]:size-4", styles[variant], className)}
    >
      {children}
    </button>
  );
}
