import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Pill, Surface } from "@/components/shared";
import { getMyResources } from "@/services/student";
import type { GapType, SessionUser } from "@/types/arena";

const FILTERS: Array<GapType | "All"> = ["All", "skill", "communication", "expectation", "aptitude"];
const LABELS: Record<string, string> = { All: "All", skill: "Skill gap", communication: "Communication", expectation: "Expectation", aptitude: "Aptitude" };

export function ResourcesTab({ user }: { user: SessionUser }) {
  const [filter, setFilter] = useState<GapType | "All">("All");
  const resources = getMyResources(user);
  const list = filter === "All" ? resources : resources.filter((r) => r.gap_type === filter);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Resources</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sorted by your gaps first, free before paid.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm ${filter === f ? "bg-secondary font-medium" : "text-muted-foreground"}`}
          >
            {LABELS[f]}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r) => (
          <Surface key={r.id} className="p-5">
            <div className="flex items-center justify-between">
              <Pill tone="blue">{LABELS[r.gap_type] ?? r.gap_type}</Pill>
              {r.is_paid ? <Pill tone="attention">Paid</Pill> : <Pill tone="success">Free</Pill>}
            </div>
            <p className="mt-3 font-medium">{r.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{r.skill} · {r.level} · {r.kind}</p>
            <a href={r.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm text-success">
              Open resource <ExternalLink className="size-3.5" />
            </a>
          </Surface>
        ))}
        {list.length === 0 && <p className="text-sm text-muted-foreground">No resources in this category yet.</p>}
      </div>
    </section>
  );
}
