import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function SeraMark({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-sage text-sage-foreground shadow-[var(--shadow-soft)]"><Sparkles className="size-5" /></span>{!compact && <div><div className="text-sm font-medium uppercase tracking-[0.16em]">Sera Interview Arena</div><div className="text-[10px] text-muted-foreground">by YZI Works</div></div>}</div>;
}

export function Surface({ children, className, inset = false }: { children: React.ReactNode; className?: string; inset?: boolean }) {
  return <div className={cn(inset ? "clay-inset" : "clay", "rounded-2xl", className)}>{children}</div>;
}

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "attention" | "sage" | "rose" | "blue" }) {
  const tones = { neutral: "bg-secondary text-secondary-foreground", success: "bg-sage/45 text-success", attention: "bg-amber-soft/40 text-attention", sage: "bg-sage/55 text-sage-foreground", rose: "bg-rose-soft/55 text-rose-foreground", blue: "bg-blue-soft/55 text-blue-foreground" };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium", tones[tone])}>{children}</span>;
}

export function ProgressBar({ value, tone = "sage", marker }: { value: number; tone?: "sage" | "amber" | "rose" | "blue"; marker?: number }) {
  const colors = { sage: "bg-sage", amber: "bg-amber-soft", rose: "bg-rose-soft", blue: "bg-blue-soft" };
  return <div className="clay-inset relative h-2 overflow-visible rounded-full"><div className={cn("h-2 rounded-full transition-[width] duration-700", colors[tone])} style={{ width: `${value}%` }} />{marker !== undefined && <span className="absolute -top-1 h-4 w-0.5 bg-foreground" style={{ left: `${marker}%` }} />}</div>;
}

export function ScoreRing({ value, label, tone = "sage", size = "md" }: { value: number; label?: string; tone?: "sage" | "amber" | "rose" | "blue"; size?: "sm" | "md" | "lg" }) {
  const color = { sage: "var(--sage)", amber: "var(--amber-soft)", rose: "var(--rose-soft)", blue: "var(--blue-soft)" }[tone];
  const px = size === "lg" ? 128 : size === "sm" ? 72 : 96;
  return <div className="text-center"><div className="relative mx-auto grid place-items-center rounded-full" style={{ width: px, height: px, background: `conic-gradient(${color} ${value * 3.6}deg, var(--secondary) 0deg)` }}><div className="grid size-[78%] place-items-center rounded-full bg-background text-xl font-medium shadow-[var(--shadow-inset)]">{value}</div></div>{label && <div className="mt-2 text-xs text-muted-foreground">{label}</div>}</div>;
}