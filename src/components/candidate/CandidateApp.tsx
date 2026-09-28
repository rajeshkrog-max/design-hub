import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BarChart3, Bell, BookOpen, LayoutGrid, LogOut, Mic, Sun, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill, SeraMark } from "@/components/shared";
import { subscribeStore } from "@/data/mock/store";
import { PLANS, journeyProgress, profileTier } from "@/lib/rules";
import { cn } from "@/lib/utils";
import { useSession } from "@/services/session";
import { getMyAccount, getMyProfile, getMySession } from "@/services/student";
import { HomeTab } from "./home/HomeTab";
import { InterviewTab } from "./interview/InterviewTab";
import { ProfileTab } from "./profile/ProfileTab";
import { ReportsTab } from "./reports/ReportsTab";
import { ResourcesTab } from "./resources/ResourcesTab";
import { initials, type View } from "./ui";

const MAIN_NAV = [
  { key: "dash", label: "Dashboard", Icon: LayoutGrid },
  { key: "interview", label: "Interview", Icon: Mic },
  { key: "reports", label: "Reports", Icon: BarChart3 },
  { key: "resources", label: "Resources", Icon: BookOpen },
] as const;

const THEME_KEY = "sera-theme";

function toggleTheme() {
  const root = document.documentElement;
  const dark = root.dataset["theme"] ? root.dataset["theme"] === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset["theme"] = dark ? "light" : "dark";
  try {
    localStorage.setItem(THEME_KEY, root.dataset["theme"]);
  } catch {
    // storage unavailable: the toggle still works for this visit
  }
}

export function CandidateApp() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("dash");
  const [, setVersion] = useState(0);

  // every service write persists the mock store; re-render so the sidebar, top bar and views stay in sync
  useEffect(() => subscribeStore(() => setVersion((v) => v + 1)), []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) document.documentElement.dataset["theme"] = saved;
    } catch {
      // storage unavailable: follow the system theme
    }
  }, []);

  if (!user || user.role !== "student") {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="text-center">
          <p className="text-lg font-medium">You don't have access</p>
          <p className="mt-2 text-sm text-muted-foreground">Sign in as a student to open your arena.</p>
          <Button className="mt-6" onClick={() => navigate({ to: "/login" })}>Go to login</Button>
        </div>
      </main>
    );
  }

  const account = getMyAccount(user);
  const profile = getMyProfile(user);
  const { session, rounds, company } = getMySession(user);
  const name = profile?.personal?.name ?? account.student.name;
  const liveRound = rounds.some((r) => r.is_current && r.status === "live");
  const tier = profileTier(profile?.strength_score ?? 0);

  const titles: Record<View, [string, string]> = {
    dash: ["Dashboard", new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })],
    interview: ["Interview", company ? `${company.name} · ${company.role}` : "Choose your target company"],
    reports: ["Reports", session ? `Attempt ${session.attempt_no}` : "Unlocks as your rounds finish"],
    resources: ["Resources", "Picked for your gaps"],
    profile: ["My profile", `${tier.name} profile · ${tier.match}`],
  };

  function logOut() {
    signOut();
    navigate({ to: "/login" });
  }

  function go(next: View) {
    setView(next);
    window.scrollTo(0, 0);
  }

  return (
    <div className="min-h-screen bg-background p-4 text-ink">
      <div className="mx-auto grid min-h-[calc(100vh-32px)] max-w-[1440px] gap-5 min-[860px]:grid-cols-[232px_minmax(0,1fr)]">
        <aside
          aria-label="Main navigation"
          className="clay flex flex-wrap items-center gap-3 rounded-3xl p-3 min-[860px]:sticky min-[860px]:top-4 min-[860px]:h-[calc(100vh-32px)] min-[860px]:flex-col min-[860px]:flex-nowrap min-[860px]:items-stretch min-[860px]:gap-[22px] min-[860px]:px-4 min-[860px]:py-[22px]"
        >
          <div className="px-1.5"><BrandMark /></div>
          <div className="eyebrow hidden px-2 min-[860px]:block">Main menu</div>
          <nav className="flex flex-wrap gap-1 min-[860px]:flex-col">
            {MAIN_NAV.map(({ key, label, Icon }) => (
              <NavButton key={key} on={view === key} onClick={() => go(key)} label={label} Icon={Icon} dot={key === "interview" && liveRound} />
            ))}
          </nav>
          <div className="eyebrow hidden px-2 min-[860px]:block">Account</div>
          <nav className="flex flex-wrap gap-1 min-[860px]:flex-col">
            <NavButton on={view === "profile"} onClick={() => go("profile")} label="My profile" Icon={UserRound} />
            <NavButton onClick={logOut} label="Log out" Icon={LogOut} />
          </nav>
          <PlanCard account={account} />
        </aside>

        <main className="flex min-w-0 flex-col gap-5">
          <header className="clay flex items-center gap-3.5 rounded-3xl py-3 pl-5 pr-4">
            <h1 className="text-[17px] font-semibold">{titles[view][0]}</h1>
            <span className="hidden h-5 w-px bg-line min-[520px]:block" />
            <span className="hidden truncate text-[12.5px] text-ink-2 min-[520px]:block">{titles[view][1]}</span>
            <span className="flex-1" />
            <Pill tone="sage" className="max-[420px]:hidden">Progress status · <b className="tabular-nums">{journeyProgress(rounds)}%</b></Pill>
            <IconButton label="Switch light or dark theme" onClick={toggleTheme}><Sun /></IconButton>
            <IconButton label="Notifications"><Bell /></IconButton>
            <div className="flex items-center gap-2.5 rounded-[14px] bg-panel py-[5px] pl-[5px] pr-3 shadow-raise-sm max-[520px]:pr-[5px]">
              <span className="grid size-[30px] place-items-center rounded-[10px] bg-blue text-[11.5px] font-semibold text-blue-ink">{initials(name)}</span>
              <span className="text-[12.5px] font-semibold max-[520px]:hidden">{name}</span>
            </div>
          </header>

          {view === "dash" && <HomeTab user={user} goTo={go} />}
          {view === "interview" && <InterviewTab user={user} goTo={go} />}
          {view === "reports" && <ReportsTab user={user} goTo={go} />}
          {view === "resources" && <ResourcesTab user={user} />}
          {view === "profile" && <ProfileTab user={user} goTo={go} />}
        </main>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <SeraMark compact />
      <div>
        <b className="block text-[12.5px] font-semibold tracking-[0.14em]">SERA ARENA</b>
        <span className="text-[11px] text-ink-3">Interview practice</span>
      </div>
    </div>
  );
}

function NavButton({ label, Icon, on = false, dot = false, onClick }: { label: string; Icon: typeof Mic; on?: boolean; dot?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={on ? "page" : undefined}
      className={cn(
        "flex items-center gap-[11px] rounded-[13px] px-2.5 py-2 text-left font-medium text-ink-2 hover:text-ink min-[860px]:px-3 min-[860px]:py-2.5",
        on && "clay-inset text-ink",
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      <span className="max-[520px]:sr-only">{label}</span>
      {dot && <i className="ml-auto size-[7px] rounded-full bg-amber" title="Round in progress" />}
    </button>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className="grid size-[38px] shrink-0 place-items-center rounded-xl bg-panel shadow-raise-sm [&_svg]:size-[18px]">
      {children}
    </button>
  );
}

/** Institute students: institute, plan and credits (never prices). Independents: their plan name. */
function PlanCard({ account }: { account: ReturnType<typeof getMyAccount> }) {
  const { student, institute, credits_left } = account;
  const plan = institute
    ? `${institute.name.split(" ")[0]} Institute · ${institute.plan.charAt(0).toUpperCase()}${institute.plan.slice(1)} plan`
    : student.plan ? `${PLANS[student.plan].label} plan` : "No plan yet";
  const pct = student.credits_total ? Math.round((credits_left / student.credits_total) * 100) : 0;
  return (
    <div className="clay-inset mt-auto hidden rounded-2xl p-3.5 min-[860px]:block">
      <div className="eyebrow">{plan}</div>
      <div className="mt-2 flex justify-between text-[12.5px]">
        <span>Interview credits</span>
        <b className="tabular-nums">{credits_left} of {student.credits_total} left</b>
      </div>
      <div className="clay-inset mt-2 h-1.5 overflow-hidden rounded-md">
        <i className="block h-full rounded-md bg-sage" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
