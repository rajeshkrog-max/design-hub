import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill, Surface } from "@/components/shared";
import { ROUND_LABELS } from "@/lib/rules";
import { exportStudentsCsv, getInstituteOverview, listStudents, type StudentFilters } from "@/services/institute";
import type { SessionUser } from "@/types/arena";

export function StudentsTab({ user, openStudent }: { user: SessionUser; openStudent: (id: string) => void }) {
  const [filters, setFilters] = useState<StudentFilters>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { batches } = getInstituteOverview(user);
  const students = useMemo(() => listStudents(user, filters), [user, filters]);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function downloadCsv() {
    const ids = selected.size ? [...selected] : students.map((d) => d.student.id);
    const csv = exportStudentsCsv(user, ids);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectCls = "h-9 rounded-md border border-input bg-background px-2 text-sm";

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium">Students</h1>
        <Button variant="clay" onClick={downloadCsv}>
          <Download className="size-4" /> Export CSV {selected.size > 0 && `(${selected.size})`}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search name or email" value={filters.search ?? ""} onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })} />
        </div>
        <select className={selectCls} value={filters.batch ?? ""} onChange={(e) => setFilters({ ...filters, batch: e.target.value || undefined })}>
          <option value="">All batches</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className={selectCls} value={filters.status ?? ""} onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}>
          <option value="">Any status</option>
          <option value="invited">Invited</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <select className={selectCls} value={filters.round ?? ""} onChange={(e) => setFilters({ ...filters, round: e.target.value || undefined })}>
          <option value="">Any round</option>
          {Object.entries(ROUND_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select className={selectCls} value={filters.band ?? ""} onChange={(e) => setFilters({ ...filters, band: e.target.value || undefined })}>
          <option value="">Any band</option>
          <option value="strong">Strong</option>
          <option value="good">Good</option>
          <option value="starter">Starter</option>
        </select>
      </div>
      <Surface className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
              <th className="p-3"></th>
              <th className="p-3">Name</th>
              <th className="p-3">Batch</th>
              <th className="p-3">State</th>
              <th className="p-3">Readiness</th>
              <th className="p-3">Verdict</th>
              <th className="p-3">Weak area</th>
            </tr>
          </thead>
          <tbody>
            {students.map((d) => (
              <tr key={d.student.id} className="cursor-pointer border-b border-border/40 hover:bg-secondary/30" onClick={() => openStudent(d.student.id)}>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(d.student.id)} onChange={() => toggle(d.student.id)} />
                </td>
                <td className="p-3">
                  <p className="font-medium">{d.student.name}</p>
                  <p className="text-xs text-muted-foreground">{d.student.email}</p>
                </td>
                <td className="p-3">{batches.find((b) => b.id === d.student.batch_id)?.name ?? "—"}</td>
                <td className="p-3"><Pill tone={d.session?.status === "completed" ? "success" : "neutral"}>{d.state_label}</Pill></td>
                <td className="p-3">{d.readiness}</td>
                <td className="p-3">{d.verdict}</td>
                <td className="p-3 text-muted-foreground">{d.weak_area}</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No students match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </Surface>
    </section>
  );
}
