import { useRef, useState } from "react";
import { ArrowRight, Printer, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill, ScoreRing, Surface } from "@/components/shared";
import { canPrintCv, canStartInterview, profileTier } from "@/lib/rules";
import { getMyProfile, getMySession, markCvUploaded } from "@/services/student";
import type { SessionUser } from "@/types/arena";

export function HomeTab({ user, goTo }: { user: SessionUser; goTo: (tab: "profile" | "interview" | "reports") => void }) {
  const [version, setVersion] = useState(0);
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const profile = getMyProfile(user);
  const { session, rounds, offer } = getMySession(user);
  const tier = profileTier(profile?.strength_score ?? 0);
  const firstName = profile?.personal?.name?.split(" ")[0] ?? "there";

  function handleFile(file: File | undefined) {
    if (!file) return;
    setReading(true);
    setTimeout(() => {
      markCvUploaded(user, `cv/${user.student_id}.pdf`);
      setReading(false);
      setVersion((v) => v + 1);
      goTo("profile");
    }, 2000);
  }

  // First visit, no CV yet → calm welcome + big upload card
  if (!profile?.cv_file_key && !profile?.required_complete) {
    return (
      <section className="mx-auto max-w-2xl pt-10 text-center" key={version}>
        <h1 className="text-4xl font-medium">Welcome, {firstName}</h1>
        <p className="mt-3 text-muted-foreground">Let's start with your CV — Sera will build your profile from it.</p>
        <Surface className="mt-10 p-10">
          <button
            className="flex w-full flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border p-10 transition-colors hover:border-success"
            onClick={() => fileRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files[0]);
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <UploadCloud className="size-10 text-success" />
            <span className="text-lg font-medium">Upload your CV</span>
            <span className="text-sm text-muted-foreground">PDF, up to 10 MB</span>
            {reading && <span className="text-sm text-success">Sera is reading your CV…</span>}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button variant="ghost" className="mt-6" onClick={() => goTo("profile")}>
            Fill in manually <ArrowRight className="size-4" />
          </Button>
        </Surface>
      </section>
    );
  }

  const startReady = canStartInterview(profile);
  const printReady = canPrintCv(rounds, offer);

  return (
    <section className="space-y-6" key={version}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium">Welcome back, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here is where you stand today.</p>
        </div>
        <Pill tone="sage">{tier.name} profile · {tier.ctc}</Pill>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <Surface className="p-6 text-center">
          <ScoreRing value={profile?.strength_score ?? 0} label="Profile strength" size="lg" />
          <Button variant="clay" className="mt-5 w-full" onClick={() => goTo("profile")}>Edit profile</Button>
        </Surface>
        <Surface className="p-6">
          <h2 className="font-medium">Interview arena</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {session ? "Your session is underway — pick up where you left off." : "Four rounds, one readiness picture."}
          </p>
          <Button className="mt-5 w-full" disabled={!startReady} onClick={() => goTo("interview")}>
            {session ? "Continue interview" : "Start interview"} <ArrowRight className="size-4" />
          </Button>
          {!startReady && (
            <p className="mt-3 text-xs text-muted-foreground">Complete Personal, Education, Skills and Preferences first.</p>
          )}
        </Surface>
        <Surface className="p-6">
          <h2 className="font-medium">Print CV</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {printReady ? "Offer accepted — your final CV is ready to print." : "Unlocks when all rounds are done and the offer is accepted."}
          </p>
          <Button variant="clay" className="mt-5 w-full" disabled={!printReady} onClick={() => goTo("reports")}>
            <Printer className="size-4" /> Print CV
          </Button>
        </Surface>
      </div>
      <Surface className="p-6">
        <h2 className="font-medium">Good matches for your tier</h2>
        <p className="mt-2 text-sm text-muted-foreground">{tier.match} · typical range {tier.ctc}</p>
      </Surface>
    </section>
  );
}
