import { useState } from "react";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pill, Surface } from "@/components/shared";
import { filledSections } from "@/lib/rules";
import { getMyProfile, saveProfileSection } from "@/services/student";
import type {
  CertificationItem, ExperienceItem, PreferencesSection, ProfileSectionKey,
  ProjectItem, SessionUser, StudentProfile,
} from "@/types/arena";

const SECTIONS: Array<{ key: ProfileSectionKey; title: string; optional: boolean }> = [
  { key: "personal", title: "Personal", optional: false },
  { key: "education", title: "Education", optional: false },
  { key: "skills", title: "Skills", optional: false },
  { key: "preferences", title: "Job preferences", optional: false },
  { key: "summary", title: "About you", optional: true },
  { key: "experience", title: "Internships and work", optional: true },
  { key: "projects", title: "Projects", optional: true },
  { key: "certifications", title: "Certifications", optional: true },
  { key: "achievements", title: "Achievements and coding profiles", optional: true },
  { key: "activities", title: "Activities and leadership", optional: true },
  { key: "languages", title: "Languages", optional: true },
];

function Field({ label, value, onChange, area = false, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; area?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {area ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </label>
  );
}

function SectionEditor({ profile, section, onSave, onSkip }: {
  profile: StudentProfile;
  section: ProfileSectionKey;
  onSave: (value: unknown) => void;
  onSkip: () => void;
}) {
  const fromCv = profile.cv_extracted;
  const sparkle = fromCv ? <Sparkles className="size-3.5 text-success" /> : null;

  if (section === "personal") {
    const v = profile.personal;
    const [f, setF] = useState({
      name: v?.name ?? "", email: v?.email ?? "", phone: v?.phone ?? "",
      city: v?.city ?? "", linkedin: v?.linkedin ?? "",
    });
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={<>Name {sparkle}</> as unknown as string} value={f.name} onChange={(x) => setF({ ...f, name: x })} />
        <Field label="Email" value={f.email} onChange={(x) => setF({ ...f, email: x })} />
        <Field label="Phone" value={f.phone} onChange={(x) => setF({ ...f, phone: x })} />
        <Field label="City" value={f.city} onChange={(x) => setF({ ...f, city: x })} />
        <Field label="LinkedIn" value={f.linkedin} onChange={(x) => setF({ ...f, linkedin: x })} />
        <div className="flex items-end gap-3">
          <Button onClick={() => onSave({ ...f, photo_url: v?.photo_url ?? null })}>Save section</Button>
        </div>
      </div>
    );
  }

  if (section === "education") {
    const v = profile.education;
    const [f, setF] = useState({
      degree: v?.degree ?? "", branch: v?.branch ?? "", college: v?.college ?? "",
      grad_year: v?.grad_year?.toString() ?? "", cgpa: v?.cgpa ?? "",
      class_xii: v?.class_xii ?? "", class_x: v?.class_x ?? "", gap: v?.gap ?? "",
    });
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Degree" value={f.degree} onChange={(x) => setF({ ...f, degree: x })} />
        <Field label="Branch" value={f.branch} onChange={(x) => setF({ ...f, branch: x })} />
        <Field label="College" value={f.college} onChange={(x) => setF({ ...f, college: x })} />
        <Field label="Graduating year" value={f.grad_year} onChange={(x) => setF({ ...f, grad_year: x })} />
        <Field label="CGPA or percentage" value={f.cgpa} onChange={(x) => setF({ ...f, cgpa: x })} />
        <Field label="Class XII (optional)" value={f.class_xii} onChange={(x) => setF({ ...f, class_xii: x })} />
        <Field label="Class X (optional)" value={f.class_x} onChange={(x) => setF({ ...f, class_x: x })} />
        <Field label="Education gap (optional)" value={f.gap} onChange={(x) => setF({ ...f, gap: x })} />
        <div className="flex items-end">
          <Button onClick={() => onSave({ ...f, grad_year: Number(f.grad_year) || null, class_xii: f.class_xii || undefined, class_x: f.class_x || undefined, gap: f.gap || undefined })}>Save section</Button>
        </div>
      </div>
    );
  }

  if (section === "skills") {
    const v = profile.skills;
    const [tech, setTech] = useState(v?.technical.map((s) => `${s.name} (${s.level})`).join(", ") ?? "");
    const [tools, setTools] = useState(v?.tools.map((s) => `${s.name} (${s.level})`).join(", ") ?? "");
    const [soft, setSoft] = useState(v?.soft.join(", ") ?? "");
    const parse = (raw: string) =>
      raw.split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
        const m = s.match(/^(.*?)\s*\((basic|intermediate|advanced)\)$/i);
        return { name: m?.[1] ?? s, level: ((m?.[2]?.toLowerCase() ?? "intermediate") as "basic" | "intermediate" | "advanced") };
      });
    return (
      <div className="grid gap-4">
        <Field label="Technical skills — comma separated, e.g. SQL (advanced)" value={tech} onChange={setTech} />
        <Field label="Tools" value={tools} onChange={setTools} />
        <Field label="Soft skills" value={soft} onChange={setSoft} />
        <div>
          <Button onClick={() => onSave({ technical: parse(tech), tools: parse(tools), soft: soft.split(",").map((s) => s.trim()).filter(Boolean) })}>Save section</Button>
        </div>
      </div>
    );
  }

  if (section === "preferences") {
    const v = profile.preferences;
    const [f, setF] = useState<PreferencesSection>({
      role: v?.role ?? "", cities: v?.cities ?? [], expected_ctc: v?.expected_ctc ?? "",
      relocate: v?.relocate ?? true, available_from: v?.available_from ?? "",
    });
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Target role" value={f.role} onChange={(x) => setF({ ...f, role: x })} />
        <Field label="Preferred cities (comma separated)" value={f.cities.join(", ")} onChange={(x) => setF({ ...f, cities: x.split(",").map((c) => c.trim()).filter(Boolean) })} />
        <Field label="Expected CTC" value={f.expected_ctc} onChange={(x) => setF({ ...f, expected_ctc: x })} />
        <Field label="Available from" value={f.available_from} onChange={(x) => setF({ ...f, available_from: x })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.relocate} onChange={(e) => setF({ ...f, relocate: e.target.checked })} />
          Open to relocate
        </label>
        <div className="flex items-end"><Button onClick={() => onSave(f)}>Save section</Button></div>
      </div>
    );
  }

  if (section === "summary") {
    const [v, setV] = useState(profile.summary ?? "");
    return (
      <div className="grid gap-4">
        <Field label="Short summary — Sera drafts this from your CV" value={v} onChange={setV} area />
        <div className="flex gap-3">
          <Button onClick={() => onSave(v)}>Save section</Button>
          <Button variant="ghost" onClick={onSkip}>Skip for now</Button>
        </div>
      </div>
    );
  }

  if (section === "experience" || section === "projects" || section === "certifications") {
    const items = (profile[section] as unknown as Array<Record<string, string>>) ?? [];
    const fields: Record<string, string[]> = {
      experience: ["company", "role", "dates", "type", "achievements"],
      projects: ["title", "stack", "role", "impact", "link"],
      certifications: ["name", "issuer", "year", "link"],
    };
    return (
      <RepeatableEditor
        items={items}
        fields={fields[section]!}
        onSave={(rows) => onSave(rows)}
        onSkip={onSkip}
      />
    );
  }

  // achievements, activities, languages — simple comma lists
  const list = (profile[section] as string[]) ?? [];
  return <ListEditor items={list} onSave={(rows) => onSave(rows)} onSkip={onSkip} />;
}

function RepeatableEditor({ items, fields, onSave, onSkip }: {
  items: Array<Record<string, string>>;
  fields: string[];
  onSave: (rows: Array<Record<string, string>>) => void;
  onSkip: () => void;
}) {
  const [rows, setRows] = useState(items.length ? items : [Object.fromEntries(fields.map((f) => [f, ""]))]);
  return (
    <div className="space-y-5">
      {rows.map((row, i) => (
        <div key={i} className="grid gap-3 rounded-xl bg-secondary/40 p-4 sm:grid-cols-2">
          {fields.map((f) => (
            <Field key={f} label={f[0]!.toUpperCase() + f.slice(1)} value={row[f] ?? ""}
              onChange={(x) => setRows(rows.map((r, j) => (j === i ? { ...r, [f]: x } : r)))} />
          ))}
        </div>
      ))}
      <div className="flex flex-wrap gap-3">
        <Button variant="clay" onClick={() => setRows([...rows, Object.fromEntries(fields.map((f) => [f, ""]))])}>Add another</Button>
        <Button onClick={() => onSave(rows.filter((r) => Object.values(r).some((v) => v.trim())))}>Save section</Button>
        <Button variant="ghost" onClick={onSkip}>Skip for now</Button>
      </div>
    </div>
  );
}

function ListEditor({ items, onSave, onSkip }: { items: string[]; onSave: (rows: string[]) => void; onSkip: () => void }) {
  const [raw, setRaw] = useState(items.join(", "));
  return (
    <div className="grid gap-4">
      <Field label="Comma separated" value={raw} onChange={setRaw} area />
      <div className="flex gap-3">
        <Button onClick={() => onSave(raw.split(",").map((s) => s.trim()).filter(Boolean))}>Save section</Button>
        <Button variant="ghost" onClick={onSkip}>Skip for now</Button>
      </div>
    </div>
  );
}

export function ProfileTab({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState<ProfileSectionKey | null>(null);
  const [version, setVersion] = useState(0);
  const profile = getMyProfile(user);
  if (!profile) return <p className="text-sm text-muted-foreground">Profile not found.</p>;
  const filled = filledSections(profile);

  return (
    <section className="space-y-4" key={version}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium">Your profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Strength {profile.strength_score} · {profile.strength_tier} tier. Sparkles mark fields Sera read from your CV.</p>
        </div>
        <Pill tone="sage">{filled.length} / {SECTIONS.length} sections</Pill>
      </div>
      {SECTIONS.map(({ key, title, optional }) => {
        const done = filled.includes(key);
        const isOpen = open === key;
        return (
          <Surface key={key} className="overflow-hidden">
            <button
              className="flex w-full items-center justify-between p-5 text-left"
              onClick={() => setOpen(isOpen ? null : key)}
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                {done ? <Check className="size-4 text-success" /> : <span className="size-4 rounded-full border border-border" />}
                {title}
                {optional && <span className="text-xs font-normal text-muted-foreground">optional</span>}
              </span>
              <ChevronRight className={`size-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
            </button>
            {isOpen && (
              <div className="border-t border-border/60 p-5">
                <SectionEditor
                  profile={profile}
                  section={key}
                  onSave={(value) => {
                    saveProfileSection(user, key, value);
                    setOpen(null);
                    setVersion((v) => v + 1);
                  }}
                  onSkip={() => setOpen(null)}
                />
              </div>
            )}
          </Surface>
        );
      })}
    </section>
  );
}
