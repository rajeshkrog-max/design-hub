import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "sage" | "amber" | "rose" | "blue";

/** Fill colour and text-on-fill colour for each palette tone. */
export const TONE_BG: Record<Tone, string> = { sage: "bg-sage", amber: "bg-amber", rose: "bg-rose", blue: "bg-blue" };
export const TONE_ON: Record<Tone, string> = { sage: "text-sage-ink", amber: "text-amber-ink", rose: "text-rose-ink", blue: "text-blue-ink" };
const TONE_VAR: Record<Tone, string> = { sage: "var(--sage)", amber: "var(--amber)", rose: "var(--rose)", blue: "var(--blue)" };

export function SeraMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="clay-chip grid size-9 place-items-center rounded-xl bg-sage text-sage-ink shadow-raise-sm"><Sparkles className="size-[18px]" /></span>
      {!compact && <div><div className="text-[12.5px] font-semibold uppercase tracking-[0.14em]">Sera Interview Arena</div><div className="text-[11px] text-ink-3">by YZI Works</div></div>}
    </div>
  );
}

export function Surface({ children, className, inset = false }: { children: React.ReactNode; className?: string; inset?: boolean }) {
  return <div className={cn(inset ? "clay-inset rounded-2xl" : "clay rounded-3xl", className)}>{children}</div>;
}

export function Pill({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "success" | "attention" | "bad" | "raised" | Tone; className?: string }) {
  const tones = {
    neutral: "bg-secondary text-ink-2",
    raised: "bg-panel text-ink shadow-raise-sm",
    success: "bg-sage text-sage-ink",
    attention: "bg-warn/15 text-warn",
    bad: "bg-bad text-white",
    sage: "bg-sage text-sage-ink",
    amber: "bg-amber text-amber-ink",
    rose: "bg-rose text-rose-ink",
    blue: "bg-blue text-blue-ink",
  };
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,.4)]", tones[tone], className)}>{children}</span>;
}

/** Inset track with a coloured fill and an optional marker (e.g. the pass bar). */
export function ProgressBar({ value, tone = "sage", marker, className }: { value: number; tone?: Tone; marker?: number; className?: string }) {
  return (
    <div className={cn("clay-inset relative h-2 rounded-lg", className)}>
      <i
        className={cn("absolute inset-y-0 left-0 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,.45),inset_0_-2px_3px_rgba(0,0,0,.10)] transition-[width] duration-700", TONE_BG[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
      {marker !== undefined && <b className="absolute -top-1 h-4 w-0.5 rounded-sm bg-ink" style={{ left: `${marker}%` }} />}
    </div>
  );
}

/** SVG progress ring with the value in the middle. */
export function ScoreRing({ value, label, tone = "sage", size = "md", text }: { value: number; label?: string; tone?: Tone; size?: "sm" | "md" | "lg" | number; text?: string }) {
  const px = typeof size === "number" ? size : size === "lg" ? 128 : size === "sm" ? 72 : 96;
  const r = px / 2 - 9;
  const length = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="shrink-0 text-center">
      <svg viewBox={`0 0 ${px} ${px}`} width={px} height={px} role="img" aria-label={`${text ?? value}${label ? ` ${label}` : ""}`}>
        <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke="var(--lo)" strokeWidth="9" opacity=".45" />
        <circle
          cx={px / 2} cy={px / 2} r={r} fill="none" stroke={TONE_VAR[tone]} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${((pct / 100) * length).toFixed(1)} ${length.toFixed(1)}`} transform={`rotate(-90 ${px / 2} ${px / 2})`}
        />
        <text x={px / 2} y={px / 2 + px / 13} textAnchor="middle" fontSize={px / 4.4} fontWeight="600" fill="var(--ink)" fontFamily="Manrope, sans-serif">{text ?? value}</text>
      </svg>
      {label && <div className="mt-2 text-xs text-ink-3">{label}</div>}
    </div>
  );
}
