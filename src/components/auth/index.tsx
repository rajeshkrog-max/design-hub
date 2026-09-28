import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, Check, KeyRound, Mail, MessageCircle, MessageSquareText, School, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/shared";
import { loginInstitute, requestOtp, verifyOtp, type OtpRequest, type StudentKind } from "@/services/auth";
import { useSession } from "@/services/session";
import { AuthFrame, Field } from "./shared";

type Role = "student" | "institute";

export function StudentLogin() {
  return <AuthPage defaultRole="student" />;
}
export function InstituteLogin() {
  return <AuthPage defaultRole="institute" />;
}

// UI only: no real validation. Any input continues; the stubs in services/auth.ts decide the session.
export function AuthPage({ defaultRole = "student" }: { defaultRole?: Role }) {
  const [role, setRole] = useState<Role>(defaultRole);
  const [kind, setKind] = useState<StudentKind>("institute");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [otpFor, setOtpFor] = useState<OtpRequest | null>(null);
  const student = role === "student";

  const title = otpFor
    ? "Enter your code."
    : !student ? "Institute workspace" : mode === "signin" ? "Welcome back." : "Create your account.";
  const copy = otpFor
    ? "We sent a 6-digit code to your WhatsApp."
    : !student
      ? "One login for your placement team."
      : kind === "institute" ? "Use the code your placement cell shared with you." : "Practise on your own, no institute needed.";

  return (
    <AuthFrame title={title} copy={copy}>
      {otpFor ? (
        <OtpForm request={otpFor} isSignup={mode === "signup"} onBack={() => setOtpFor(null)} />
      ) : (
        <>
          <div className="clay-inset mb-2 grid grid-cols-2 gap-1 rounded-xl p-1">
            {(["student", "institute"] as const).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium ${role === r ? "clay-soft text-success" : "text-muted-foreground"}`}>
                {r === "student" ? <UserRound className="size-4" /> : <Building2 className="size-4" />}
                {r === "student" ? "Student" : "Institute"}
              </button>
            ))}
          </div>
          {student ? (
            <>
              <div className="mt-3 flex justify-center gap-5 text-xs">
                {(["institute", "independent"] as const).map((k) => (
                  <button key={k} type="button" onClick={() => setKind(k)} className={kind === k ? "font-medium text-success" : "text-muted-foreground"}>
                    {k === "institute" ? "Through my institute" : "On my own"}
                  </button>
                ))}
              </div>
              <StudentForm key={`${kind}-${mode}`} kind={kind} isSignup={mode === "signup"} onSent={setOtpFor} />
              <p className="mt-5 text-center text-xs text-muted-foreground">
                {mode === "signin" ? "New here? " : "Already have an account? "}
                <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-medium text-success">
                  {mode === "signin" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </>
          ) : (
            <InstituteForm />
          )}
        </>
      )}
    </AuthFrame>
  );
}

function StudentForm({ kind, isSignup, onSent }: { kind: StudentKind; isSignup: boolean; onSent: (request: OtpRequest) => void }) {
  const [form, setForm] = useState({ institute_code: "", email: "", whatsapp: "", name: "" });
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const request: OtpRequest = kind === "institute"
      ? { kind, institute_code: form.institute_code, whatsapp: form.whatsapp, ...(isSignup ? { name: form.name, email: form.email } : {}) }
      : { kind, email: form.email, whatsapp: form.whatsapp, ...(isSignup ? { name: form.name } : {}) };
    requestOtp(request);
    onSent(request);
  }

  return (
    <form onSubmit={submit}>
      {isSignup && <Field label="Full name" placeholder="Riya Kulkarni" icon={UserRound} value={form.name} onChange={set("name")} autoComplete="name" />}
      {kind === "institute" && <Field label="Institute code" placeholder="PIT-CSE26" icon={School} value={form.institute_code} onChange={set("institute_code")} />}
      {(kind === "independent" || isSignup) && (
        <Field label="Email" placeholder="you@example.com" icon={Mail} type="email" value={form.email} onChange={set("email")} autoComplete="email" />
      )}
      <Field label="WhatsApp number" placeholder="+91 98765 43210" icon={MessageCircle} type="tel" value={form.whatsapp} onChange={set("whatsapp")} autoComplete="tel" inputMode="tel" />
      <Button type="submit" className="mt-6 h-12 w-full">Send code <ArrowRight /></Button>
    </form>
  );
}

function OtpForm({ request, isSignup, onBack }: { request: OtpRequest; isSignup: boolean; onBack: () => void }) {
  const [code, setCode] = useState("");
  const { signIn } = useSession();
  const navigate = useNavigate();

  function submit(e: FormEvent) {
    e.preventDefault();
    signIn(verifyOtp(request, code));
    // independents choose a plan right after sign-up
    navigate({ to: isSignup && request.kind === "independent" ? "/plans" : "/candidate" });
  }

  return (
    <form onSubmit={submit}>
      <Field label="Code" placeholder="6-digit code" icon={MessageSquareText} value={code} onChange={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" inputMode="numeric" />
      <Button type="submit" className="mt-6 h-12 w-full" disabled={code.length !== 6}>Verify <ArrowRight /></Button>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Wrong number? <button type="button" onClick={onBack} className="font-medium text-success">Go back</button>
      </p>
    </form>
  );
}

function InstituteForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn } = useSession();
  const navigate = useNavigate();

  function submit(e: FormEvent) {
    e.preventDefault();
    signIn(loginInstitute(email, password));
    navigate({ to: "/institute" });
  }

  return (
    <form onSubmit={submit}>
      <Field label="Institute email" placeholder="placement@institute.edu" icon={Mail} type="email" value={email} onChange={setEmail} autoComplete="username" />
      <Field label="Password" placeholder="••••••••" icon={KeyRound} type="password" value={password} onChange={setPassword} autoComplete="current-password" />
      <Button type="submit" className="mt-6 h-12 w-full">Sign in <ArrowRight /></Button>
    </form>
  );
}

export function AcceptInvite() {
  return (
    <AuthFrame title="You're invited." copy="Pioneer Institute of Technology has invited you to Sera Interview Arena.">
      <Surface inset className="p-5">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-full bg-blue-soft"><Building2 className="size-5 text-blue-foreground" /></span>
          <div>
            <p className="text-sm font-medium">Pioneer Institute of Technology</p>
            <p className="text-xs text-muted-foreground">CSE 2026 · Student access</p>
          </div>
        </div>
      </Surface>
      <div className="my-6 space-y-3 text-xs text-muted-foreground">
        <p className="flex gap-2"><Check className="size-4 text-success" />Build your interview profile</p>
        <p className="flex gap-2"><Check className="size-4 text-success" />Complete four simulated rounds</p>
        <p className="flex gap-2"><ShieldCheck className="size-4 text-success" />Your institute sees scores and summaries</p>
      </div>
      <Button className="h-12 w-full" asChild>
        <Link to="/student-login">Accept invite <ArrowRight /></Link>
      </Button>
    </AuthFrame>
  );
}
