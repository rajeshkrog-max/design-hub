import { useRef, useState } from "react";
import { Copy, FileText, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill, ProgressBar, Surface } from "@/components/shared";
import { addRosterRows, listBatches } from "@/services/institute";
import type { SessionUser } from "@/types/arena";

export function BatchesTab({ user, openReport }: { user: SessionUser; openReport: (id: string) => void }) {
  const [version, setVersion] = useState(0);
  const [uploadFor, setUploadFor] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const batches = listBatches(user);

  function handleCsv(batchId: string, file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      const rows = text
        .split("\n")
        .slice(1)
        .map((line) => {
          const [name, email] = line.split(",").map((s) => s.trim().replaceAll('"', ""));
          return { name: name ?? "", email: email ?? "" };
        })
        .filter((r) => r.name && r.email);
      const added = addRosterRows(user, batchId, rows);
      setMessage(`${added} student(s) invited.`);
      setUploadFor(null);
      setVersion((v) => v + 1);
    };
    reader.readAsText(file);
  }

  return (
    <section className="space-y-5" key={version}>
      <h1 className="text-2xl font-medium">Batches</h1>
      {message && <p className="text-sm text-success">{message}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {batches.map((b) => (
          <Surface key={b.id} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{b.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{b.program} · {b.year}</p>
              </div>
              <Pill tone="sage">{b.student_count} students</Pill>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs"><span>Completed all rounds</span><span className="text-muted-foreground">{b.completed} / {b.student_count}</span></div>
              <ProgressBar value={b.student_count ? Math.round((b.completed / b.student_count) * 100) : 0} />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Pill>Invite code: {b.invite_code}</Pill>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard?.writeText(b.invite_code);
                  setCopied(b.id);
                  setTimeout(() => setCopied(""), 1500);
                }}
              >
                <Copy className="size-3.5" /> {copied === b.id ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="clay" onClick={() => setUploadFor(b.id)}>
                <UploadCloud className="size-4" /> Upload roster CSV
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openReport(b.id)}>
                <FileText className="size-4" /> Batch report
              </Button>
            </div>
            {uploadFor === b.id && (
              <div className="mt-4 rounded-xl border-2 border-dashed border-border p-5 text-center">
                <p className="text-sm text-muted-foreground">CSV with columns: name, email</p>
                <Button size="sm" className="mt-3" onClick={() => fileRef.current?.click()}>Choose file</Button>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleCsv(b.id, e.target.files?.[0])} />
              </div>
            )}
          </Surface>
        ))}
      </div>
    </section>
  );
}
