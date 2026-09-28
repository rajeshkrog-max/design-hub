import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Building2, Check, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeraMark, Surface } from "@/components/shared";
import { getStore } from "@/data/mock/store";
import { useSession } from "@/services/session";
import type { SessionUser } from "@/types/arena";

export function StudentLogin() {
  return <AuthPage defaultRole="student" />;
}
export function InstituteLogin() {
  return <AuthPage defaultRole="institute" />;
}

export function AuthPage({ defaultRole = "student" }: { defaultRole?: "student" | "institute" }) {
  const [role, setRole] = useState(defaultRole);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const { signIn } = useSession();
  const navigate = useNavigate();
  const student = role === "student";
  const store = getStore();

  // Demo picker: every sign-in picks a seeded identity so tenant isolation is testable.
  const demoStudents = store.students.filter((s) => s.auth_user_id);
  const demoStaff = store.institute_users;

  function enterAs(user: SessionUser) {
    signIn(user);
    navigate({ to: user.role === "student" ? "/candidate" : "/institute" });
  }

  const title = mode === "signin" ? (student ? "Welcome back." : "Institute workspace") : student ? "Create your student account." : "Register your institute.";
  const copy = mode === "signin"
    ? student ? "Sign in to continue your interview rounds." : "Secure access for placement and career teams."
    : student ? "You need the institute code shared by your placement cell." : "Set up a workspace for your placement team.";

  return (
    <AuthFrame title={title} copy={copy}>
      <div className="clay-inset mb-2 grid grid-cols-2 gap-1 rounded-xl p-1">
        {(["student", "institute"] as const).map((r) => (
          <button key={r} onClick={() => setRole(r)} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium ${role === r ? "clay-soft text-success" : "text-muted-foreground"}`}>
            {r === "student" ? <UserRound className="size-4" /> : <Building2 className="size-4" />}
            {r === "student" ? "Student" : "Institute"}
          </button>
        ))}
      </div>
      {mode === "signup" &&
        (student ? (
          <>
            <Field label="Institute code" placeholder="PIT-CSE26" icon={KeyRound} />
            <Field label="Full name" placeholder="Riya Kapoor" icon={UserRound} />
          </>
        ) : (
          <>
            <Field label="Institute name" placeholder="Pioneer Institute of Technology" icon={Building2} />
            <Field label="Your name" placeholder="Ananya Desai" icon={UserRound} />
          </>
        ))}
      <Field label={student ? "Email" : "Work email"} placeholder={student ? "you@college.edu" : "placement@institute.edu"} icon={Mail} />
      <Field label="Password" placeholder="••••••••" icon={KeyRound} type="password" />
      {mode === "signin" && <button className="mt-3 text-xs text-muted-foreground">Forgot password?</button>}

      <div className="mt-6">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Demo sign-in — pick an identity
        </p>
        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {student
            ? demoStudents.map((s) => (
                <button
                  key={s.id}
                  onClick={() => enterAs({ role: "student", auth_user_id: s.auth_user_id!, student_id: s.id, institute_id: s.institute_id })}
                  className="flex w-full items-center justify-between rounded-xl bg-secondary/50 px-4 py-2.5 text-left text-sm hover:bg-secondary"
                >
                  <span>{s.name}</span>
                  <span className="text-xs text-muted-foreground">{store.institutes.find((i) => i.id === s.institute_id)?.name.split(" ")[0]}</span>
                </button>
              ))
            : demoStaff.map((u) => (
                <button
                  key={u.id}
                  onClick={() => enterAs({ role: "institute", auth_user_id: u.auth_user_id, institute_user_id: u.id, institute_id: u.institute_id })}
                  className="flex w-full items-center justify-between rounded-xl bg-secondary/50 px-4 py-2.5 text-left text-sm hover:bg-secondary"
                >
                  <span>{u.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {store.institutes.find((i) => i.id === u.institute_id)?.name.split(" ")[0]} · {u.role}
                  </span>
                </button>
              ))}
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        {mode === "signin" ? "New here? " : "Already have an account? "}
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-medium text-success">
          {mode === "signin" ? (student ? "Sign up with institute code" : "Register your institute") : "Sign in"}
        </button>
      </p>
    </AuthFrame>
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

function AuthFrame({ title, copy, children }: { title: string; copy: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs text-muted-foreground"><ArrowLeft className="size-3" />Back</Link>
        <div className="mb-8"><SeraMark /><h1 className="mt-10 text-3xl font-medium">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{copy}</p></div>
        <Surface className="p-6 sm:p-8">{children}</Surface>
        <p className="mt-6 text-center text-[11px] text-muted-foreground">By continuing, you agree to the institute's Arena participation policy.</p>
      </div>
    </main>
  );
}

function Field({ label, placeholder, icon: Icon, type = "text" }: { label: string; placeholder: string; icon: typeof UserRound; type?: string }) {
  return (
    <label className="mt-4 block text-xs font-medium">
      {label}
      <span className="clay-inset mt-2 flex items-center gap-3 rounded-xl px-4">
        <Icon className="size-4 text-muted-foreground" />
        <input type={type} placeholder={placeholder} className="h-12 w-full bg-transparent text-sm outline-none" />
      </span>
    </label>
  );
}
