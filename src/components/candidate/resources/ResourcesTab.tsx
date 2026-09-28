import { useState } from "react";
import { BookOpen, Play } from "lucide-react";
import { Pill } from "@/components/shared";
import { cn } from "@/lib/utils";
import { getMyProfile, getMyResources } from "@/services/student";
import type { GapType, SessionUser } from "@/types/arena";
import { Card, GAP_LABEL, GAP_TONE } from "../ui";

const FILTERS: Array<GapType | "all"> = ["all", "skill", "communication", "expectation", "aptitude"];
const VIDEO_KINDS = new Set(["playlist", "course", "video"]);

/** A simple ladder for the student's target role. */
function careerPath(role: string): Array<[when: string, title: string, focus: string]> {
  const r = role.toLowerCase();
  if (r.includes("analyst")) return [["You are here", "Fresher analyst", "Excel, SQL basics"], ["1–2 years", "Analyst II", "Dashboards, stakeholders"], ["3–5 years", "Senior analyst", "Owning metrics"], ["6+ years", "Analytics lead", "Leading teams"]];
  if (r.includes("marketing")) return [["You are here", "Marketing associate", "Campaign basics"], ["1–2 years", "Marketing executive", "Channels, content"], ["3–5 years", "Brand manager", "Budget, strategy"], ["6+ years", "Marketing lead", "Leading teams"]];
  return [["You are here", "Fresher engineer", "SQL, DSA basics"], ["1–2 years", "Engineer II", "System design"], ["3–5 years", "Senior engineer", "Architecture"], ["6+ years", "Tech lead", "Leading teams"]];
}

export function ResourcesTab({ user }: { user: SessionUser }) {
  const [filter, setFilter] = useState<GapType | "all">("all");
  const resources = getMyResources(user);
  const list = filter === "all" ? resources : resources.filter((r) => r.gap_type === filter);
  const role = getMyProfile(user)?.preferences?.role ?? "Software engineer";

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn("rounded-xl px-3.5 py-2 text-[12.5px] font-medium text-ink-2", filter === f ? "clay-inset text-ink" : "bg-panel shadow-raise-sm")}
          >
            {f === "all" ? "For your gaps" : GAP_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="grid gap-5 min-[520px]:grid-cols-2 min-[860px]:grid-cols-3">
        {list.map((r) => (
          <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="clay block rounded-3xl p-5">
            <div className="clay-inset mb-3 grid h-24 place-items-center rounded-2xl">
              <span className="grid size-10 place-items-center rounded-full bg-panel shadow-raise-sm">
                {VIDEO_KINDS.has(r.kind) ? <Play className="size-4 fill-ink" /> : <BookOpen className="size-4" />}
              </span>
            </div>
            <Pill tone={GAP_TONE[r.gap_type]}>{GAP_LABEL[r.gap_type]}</Pill>
            <h3 className="mb-1 mt-2.5 text-[14.5px] font-semibold">{r.title}</h3>
            <p className="text-[11.5px] text-ink-3">{r.kind.charAt(0).toUpperCase() + r.kind.slice(1)} · {r.skill} · {r.is_paid ? "Paid" : "Free"}</p>
          </a>
        ))}
        {list.length === 0 && <p className="text-[12.5px] text-ink-2">No resources in this category yet.</p>}
      </div>

      <Card title={`Career path · ${role}`}>
        <div className="grid gap-3 min-[520px]:grid-cols-2 min-[860px]:grid-cols-4">
          {careerPath(role).map(([when, title, focus], i) => (
            <div key={when} className="clay-inset rounded-2xl p-3.5" style={i === 0 ? { boxShadow: "var(--inset), 0 0 0 2px var(--sage)" } : undefined}>
              <span className="eyebrow">{when}</span>
              <b className="mt-1.5 block">{title}</b>
              <span className="text-[11.5px] text-ink-3">{focus}</span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
