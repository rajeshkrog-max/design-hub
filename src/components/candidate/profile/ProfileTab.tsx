import { useRef, useState } from "react";
import {
  Award, Briefcase, ChevronRight, Code2, Folder, GraduationCap, Languages, Lock, Quote, Sparkles,
  Target, Trophy, UserRound, Users, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pill, ProgressBar } from "@/components/shared";
import { REQUIRED_PROFILE_SECTIONS, canPrintCv, filledSections, profileTier } from "@/lib/rules";
import { cn } from "@/lib/utils";
import { getMyAccount, getMyProfile, getMySession, markCvUploaded, saveProfileSection } from "@/services/student";
import type {
  PreferencesSection, ProfileSectionKey, SessionUser, StudentProfile,
} from "@/types/arena";
import { Btn, Card, initials, type GoTo } from "../ui";

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

const SECTION_META: Record<ProfileSectionKey, { title: string; Icon: typeof UserRound; empty: string }> = {
  personal: { title: "Personal details", Icon: UserRound, empty: "Name, phone, city, LinkedIn" },
  education: { title: "Education", Icon: GraduationCap, empty: "Degree, college, CGPA" },
  skills: { title: "Skills", Icon: Zap, empty: "Technical skills, tools, soft skills" },
  preferences: { title: "Job preferences", Icon: Target, empty: "Role, cities, expected CTC" },
  summary: { title: "About you", Icon: Quote, empty: "A short intro, drafted by Sera from your CV" },
  experience: { title: "Internships and work", Icon: Briefcase, empty: "Internships, part-time work" },
  projects: { title: "Projects", Icon: Code2, empty: "What you built and its impact" },
  certifications: { title: "Certifications", Icon: Award, empty: "AWS, Google, NPTEL and similar" },
  achievements: { title: "Achievements and coding profiles", Icon: Trophy, empty: "Hackathons, LeetCode, CodeChef" },
  activities: { title: "Activities and leadership", Icon: Users, empty: "Clubs, volunteering, sport" },
  languages: { title: "Languages", Icon: Languages, empty: "Languages you speak" },
};

/** One line describing what a filled section holds. */
function summaryOf(profile: StudentProfile, key: ProfileSectionKey): string | null {
  switch (key) {
    case "personal":
      return profile.personal && [profile.personal.name, profile.personal.city, profile.personal.phone].filter(Boolean).join(" · ");
    case "education":
      return profile.education && [`${profile.education.degree} ${profile.education.branch}`.trim(), profile.education.cgpa && `${profile.education.cgpa} CGPA`, profile.education.grad_year].filter(Boolean).join(" · ");
    case "skills": {
      const names = profile.skills?.technical.map((t) => t.name) ?? [];
      return names.length ? `${names.slice(0, 3).join(", ")}${names.length > 3 ? ` and ${names.length - 3} more` : ""}` : null;
    }
    case "preferences":
      return profile.preferences && [profile.preferences.role, profile.preferences.cities[0], profile.preferences.expected_ctc].filter(Boolean).join(" · ");
    case "summary":
      return profile.summary ? "Drafted by Sera from your CV" : null;
    case "experience":
      return profile.experience[0] ? `${profile.experience[0].role} · ${profile.experience[0].company} · ${profile.experience[0].dates}` : null;
    case "projects":
      return profile.projects.length ? profile.projects.map((p) => p.title).join(", ") : null;
    case "certifications":
      return profile.certifications.length ? profile.certifications.map((c) => c.name).join(", ") : null;
    default:
      return profile[key].length ? profile[key].join(", ") : null;
  }
}

function blankProfile(user: SessionUser): StudentProfile {
  return {
    student_id: user.student_id ?? "", institute_id: user.institute_id,
    personal: null, education: null, skills: null, preferences: null, summary: null,
    experience: [], projects: [], certifications: [], achievements: [], activities: [], languages: [],
    strength_score: 0, strength_tier: "Starter", required_complete: false,
    cv_file_key: null, cv_extracted: false, updated_at: "",
  };
}

export function ProfileTab({ user, goTo }: { user: SessionUser; goTo: GoTo }) {
  const [open, setOpen] = useState<ProfileSectionKey | null>(null);
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const profile = getMyProfile(user) ?? blankProfile(user);
  const account = getMyAccount(user);
  const { rounds, offer } = getMySession(user);
  const filled = filledSections(profile);
  const name = profile.personal?.name ?? account.student.name;
  const tier = profileTier(profile.strength_score);
  const strong = profileTier(80);
  const requiredDone = REQUIRED_PROFILE_SECTIONS.filter((k) => filled.includes(k)).length;
  const printReady = canPrintCv(rounds, offer);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setReading(true);
    // mock CV parsing: the backend extracts fields from the PDF later
    setTimeout(() => {
      markCvUploaded(user, `cv/${file.name}`);
      setReading(false);
    }, 1500);
  }

  function row(key: ProfileSectionKey) {
    const meta = SECTION_META[key];
    const done = filled.includes(key);
    const isOpen = open === key;
    return (
      <div key={key} className="border-t border-line first:border-t-0">
        <button className="flex w-full items-center gap-3.5 px-1 py-[13px] text-left" onClick={() => setOpen(isOpen ? null : key)} aria-expanded={isOpen}>
          <span className="clay-inset grid size-9 shrink-0 place-items-center rounded-xl text-ink-2"><meta.Icon className="size-[17px]" /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{meta.title}</span>
            <span className="block truncate text-[11.5px] text-ink-3">{summaryOf(profile, key) || meta.empty}</span>
          </span>
          {done ? <Pill tone="sage">Done</Pill> : <span className="text-[11.5px] text-ink-3">Add</span>}
          <ChevronRight className={cn("size-4 text-ink-3 transition-transform", isOpen && "rotate-90")} />
        </button>
        {isOpen && (
          <div className="px-1 pb-5 pt-1">
            <SectionEditor
              profile={profile}
              section={key}
              onSave={(value) => {
                saveProfileSection(user, key, value);
                setOpen(null);
              }}
              onSkip={() => setOpen(null)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="grid gap-5 min-[1100px]:grid-cols-[300px_minmax(0,1fr)]">
      <div className="grid content-start gap-5">
        <Card className="text-center">
          <div className="mx-auto grid size-[76px] place-items-center rounded-3xl bg-blue text-[22px] font-semibold text-blue-ink shadow-raise-sm">{initials(name)}</div>
          <h3 className="mt-3 text-base font-semibold">{name}</h3>
          <p className="text-[11.5px] text-ink-2">
            {[profile.education && `${profile.education.degree} ${profile.education.branch}`.trim(), profile.education?.grad_year, account.institute?.name ?? profile.education?.college]
              .filter(Boolean)
              .join(" · ") || "Add your education"}
          </p>
          <div className="mt-4 text-left">
            <div className="flex justify-between text-[12.5px]"><span>Profile strength</span><b className="tabular-nums">{profile.strength_score} · {tier.name}</b></div>
            <ProgressBar value={profile.strength_score} tone="amber" marker={80} className="mt-1.5" />
            <p className="mt-1.5 text-[11.5px] text-ink-3">
              {tier.name === "Strong" ? `Strong · matches ${tier.match.toLowerCase()}, ${tier.ctc}` : `Strong at 80 · matches ${strong.match.toLowerCase()}, ${strong.ctc}`}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <span className="clay-chip grid size-[34px] shrink-0 place-items-center rounded-[11px] bg-sage text-sage-ink"><Folder className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-semibold">{reading ? "Sera is reading your CV…" : profile.cv_file_key ? profile.cv_file_key.split("/").pop() : "No CV yet"}</div>
            <div className="text-[11.5px] text-ink-3">{profile.cv_extracted ? `Sera filled ${filled.length} sections` : "PDF, up to 10 MB"}</div>
          </div>
          <Btn className="px-3 py-[7px] text-[12.5px]" disabled={reading} onClick={() => fileRef.current?.click()}>{profile.cv_file_key ? "Replace" : "Upload"}</Btn>
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </Card>

        <Btn disabled={!printReady} onClick={() => goTo("reports")}>
          {!printReady && <Lock className="!size-3" />}
          {printReady ? "Print CV" : "Print CV · after offer"}
        </Btn>
      </div>

      <Card>
        <div className="mb-3.5 flex items-center gap-2.5">
          <h3 className="text-[14.5px] font-semibold">Needed to start</h3>
          <span className="flex-1" />
          {requiredDone === REQUIRED_PROFILE_SECTIONS.length
            ? <Pill tone="sage">All done</Pill>
            : <span className="text-[11.5px] text-ink-3 tabular-nums">{requiredDone} of {REQUIRED_PROFILE_SECTIONS.length}</span>}
        </div>
        {REQUIRED_PROFILE_SECTIONS.map(row)}
        <div className="mb-3.5 mt-[22px] flex items-center gap-2.5">
          <h3 className="text-[14.5px] font-semibold">Optional</h3>
          <span className="flex-1" />
          <span className="text-[11.5px] text-ink-3">Each one lifts your strength</span>
        </div>
        {(Object.keys(SECTION_META) as ProfileSectionKey[]).filter((k) => !REQUIRED_PROFILE_SECTIONS.includes(k)).map(row)}
      </Card>
    </section>
  );
}
