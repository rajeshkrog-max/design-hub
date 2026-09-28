import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeraMark, Surface } from "@/components/shared";
import { PLANS } from "@/lib/rules";
import type { PlanKey } from "@/types/arena";

export function AuthFrame({ title, copy, children }: { title: string; copy: string; children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs text-muted-foreground"><ArrowLeft className="size-3" />Back</Link>
        <div className="mb-8"><SeraMark /><h1 className="mt-10 text-3xl font-medium">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{copy}</p></div>
        <Surface className="p-6 sm:p-8">{children}</Surface>
        <p className="mt-6 text-center text-[11px] text-muted-foreground">By continuing, you agree to the Arena participation policy.</p>
      </div>
    </main>
  );
}

export function Field({
  label, placeholder, icon: Icon, value, onChange, type = "text", autoComplete, inputMode,
}: {
  label: string;
  placeholder: string;
  icon: typeof UserRound;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "email" | "text";
}) {
  return (
    <label className="mt-4 block text-xs font-medium">
      {label}
      <span className="clay-inset mt-2 flex items-center gap-3 rounded-xl px-4">
        <Icon className="size-4 text-muted-foreground" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full bg-transparent text-sm outline-none"
        />
      </span>
    </label>
  );
}

export const formatInr = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

/** Individual plans. Only shown to independent candidates. */
export function PlanCards({ onChoose }: { onChoose: (plan: PlanKey) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(Object.keys(PLANS) as PlanKey[]).map((key) => {
        const plan = PLANS[key];
        return (
          <Surface key={key} inset className="flex flex-col p-5">
            <p className="text-sm font-medium">{plan.label}</p>
            <p className="mt-2 text-2xl font-medium">{formatInr(plan.price_inr)}<span className="text-xs font-normal text-muted-foreground"> / month</span></p>
            <ul className="mt-4 flex-1 space-y-2 text-xs text-muted-foreground">
              {plan.perks.map((perk) => <li key={perk} className="flex gap-2"><Check className="size-3.5 shrink-0 text-success" />{perk}</li>)}
            </ul>
            <Button type="button" className="mt-5 w-full" variant={key === "pro" ? "default" : "clay"} onClick={() => onChoose(key)}>
              Choose {plan.label}
            </Button>
          </Surface>
        );
      })}
    </div>
  );
}
