import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Briefcase, FileText, Home, Library, LogOut, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill, SeraMark } from "@/components/shared";
import { useSession } from "@/services/session";
import { PLANS } from "@/lib/rules";
import { getMyAccount, getMyProfile } from "@/services/student";
import { HomeTab } from "./home/HomeTab";
import { ProfileTab } from "./profile/ProfileTab";
import { InterviewTab } from "./interview/InterviewTab";
import { ReportsTab } from "./reports/ReportsTab";
import { ResourcesTab } from "./resources/ResourcesTab";

const tabs = [
  { key: "home", label: "Home", Icon: Home },
  { key: "profile", label: "Profile", Icon: FileText },
  { key: "interview", label: "Interview", Icon: Mic2 },
  { key: "reports", label: "Reports", Icon: Briefcase },
  { key: "resources", label: "Resources", Icon: Library },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function CandidateApp() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("home");
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
  const profile = getMyProfile(user);
  const account = getMyAccount(user);
  const name = profile?.personal?.name ?? account.student.name;

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <SeraMark compact />
          <nav className="hidden gap-1 md:flex">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-full px-4 py-2 text-sm ${tab === key ? "bg-secondary font-medium" : "text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Pill tone="sage">{name}</Pill>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                signOut();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="size-4" /> Log out
            </Button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs whitespace-nowrap ${tab === key ? "bg-secondary font-medium" : "text-muted-foreground"}`}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <AccountStrip account={account} />
        {tab === "home" && <HomeTab user={user} goTo={setTab} />}
        {tab === "profile" && <ProfileTab user={user} />}
        {tab === "interview" && <InterviewTab user={user} />}
        {tab === "reports" && <ReportsTab user={user} />}
        {tab === "resources" && <ResourcesTab user={user} />}
      </div>
    </main>
  );
}

/** Institute students see their credits (never prices). Independents see their plan name. */
function AccountStrip({ account }: { account: ReturnType<typeof getMyAccount> }) {
  const { student, credits_left } = account;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {student.account_type === "institute" ? (
        <Pill tone="sage">Interview credits: {credits_left} of {student.credits_total}</Pill>
      ) : (
        <Pill tone="blue">{student.plan ? `${PLANS[student.plan].label} plan` : "No plan yet"}</Pill>
      )}
    </div>
  );
}
