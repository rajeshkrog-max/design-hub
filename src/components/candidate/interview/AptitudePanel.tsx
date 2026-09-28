import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/shared";
import { aptitudeQuestions } from "@/data/mock/aptitude";
import { submitAptitude } from "@/services/student";
import type { SessionUser } from "@/types/arena";

export function AptitudePanel({ user, roundId, onDone }: { user: SessionUser; roundId: string; onDone: () => void }) {
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [result, setResult] = useState<number | null>(null);
  const mcqs = aptitudeQuestions.filter((q) => q.kind === "mcq");
  const written = aptitudeQuestions.filter((q) => q.kind === "written");

  if (result !== null) {
    return (
      <Surface className="p-6 text-center">
        <p className="text-lg font-medium">Aptitude submitted</p>
        <p className="mt-2 text-sm text-muted-foreground">{result} of {mcqs.length} MCQs correct. Written answers get feedback in your report.</p>
        <Button className="mt-5" onClick={onDone}>Back to interview</Button>
      </Surface>
    );
  }

  return (
    <Surface className="p-6">
      <h2 className="font-medium">Aptitude section</h2>
      <p className="mt-1 text-sm text-muted-foreground">{mcqs.length} multiple choice + {written.length} short written answers.</p>
      <div className="mt-5 space-y-5">
        {mcqs.map((q, i) => (
          <div key={q.id}>
            <p className="text-sm font-medium">{i + 1}. {q.prompt}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${answers[q.id] === oi ? "border-success bg-sage/40" : "border-border"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
        {written.map((q, i) => (
          <div key={q.id}>
            <p className="text-sm font-medium">{mcqs.length + i + 1}. {q.prompt}</p>
            <textarea
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={3}
              value={(answers[q.id] as string) ?? ""}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <Button
        className="mt-6"
        onClick={() => {
          const attempt = submitAptitude(user, roundId, answers);
          setResult(attempt.mcq_score);
        }}
      >
        Submit aptitude
      </Button>
    </Surface>
  );
}
