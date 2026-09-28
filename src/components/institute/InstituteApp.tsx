import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BarChart3, Building2, FileText, Layers, LogOut, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill, SeraMark } from "@/components/shared";
import { useSession } from "@/services/session";
import { OverviewTab } from "./overview/OverviewTab";
import { StudentsTab } from "./students/StudentsTab";
import { StudentDetail } from "./student-detail/StudentDetail";
import { BatchesTab } from "./batches/BatchesTab";
import { AnalyticsTab } from "./analytics/AnalyticsTab";
import { SettingsTab } from "./settings/SettingsTab";
import { BatchReportView } from "@/components/reports/batch-report/BatchReportView";
import { IndividualReportView } from "@/components/reports/individual-report/IndividualReportView";

type View =
  | { key: "overview" }
  | { key: "students" }
  | { key: "student"; id: string }
  | { key: "batches" }
  | { key: "batch-report"; id: string }
  | { key: "report"; id: string }
  | { key: "analytics" }
  | { key: "settings" };

const nav = [
  { key: "overview", label: "Overview", Icon: BarChart3 },
  { key: "students", label: "Students", Icon: Users },
  { key: "batches", label: "Batches", Icon: Layers },
  { key: "analytics", label: "Analytics", Icon: FileText },
  { key: "settings", label: "Settings", Icon: Settings },
] as const;

export function InstituteApp() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const [view, setView] = useState<View>({ key: "overview" });

  if (!user || user.role !== "institute") {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="text-center">
          <p className="text-lg font-medium">You don't have access</p>
          <p className="mt-2 text-sm text-muted-foreground">Sign in with an institute account to open this workspace.</p>
          <Button className="mt-6" onClick={() => navigate({ to: "/login" })}>Go to login</Button>
        </div>
      </main>
    );
  }

  const active = view.key === "student" || view.key === "report" ? "students" : view.key === "batch-report" ? "batches" : view.key;

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-border/60 bg-background p-5 lg:min-h-screen lg:border-b-0 lg:border-r">
        <SeraMark compact />
        <nav className="mt-8 flex gap-1 overflow-x-auto lg:flex-col">
          {nav.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setView({ key } as View)}
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm whitespace-nowrap ${active === key ? "bg-secondary font-medium" : "text-muted-foreground"}`}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </nav>
        <div className="mt-8 hidden lg:block">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              signOut();
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="size-4" /> Log out
          </Button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <Building2 className="size-5 text-success" />
            <span className="font-medium">Institute workspace</span>
            <Pill>{user.role}</Pill>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => {
              signOut();
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="size-4" /> Log out
          </Button>
        </header>
        <div className="px-6 py-8">
          {view.key === "overview" && <OverviewTab user={user} />}
          {view.key === "students" && <StudentsTab user={user} openStudent={(id) => setView({ key: "student", id })} />}
          {view.key === "student" && (
            <StudentDetail user={user} studentId={view.id} openReport={(id) => setView({ key: "report", id })} back={() => setView({ key: "students" })} />
          )}
          {view.key === "report" && <IndividualReportView user={user} studentId={view.id} back={() => setView({ key: "student", id: view.id })} />}
          {view.key === "batches" && <BatchesTab user={user} openReport={(id) => setView({ key: "batch-report", id })} />}
          {view.key === "batch-report" && <BatchReportView user={user} batchId={view.id} back={() => setView({ key: "batches" })} />}
          {view.key === "analytics" && <AnalyticsTab user={user} />}
          {view.key === "settings" && <SettingsTab user={user} />}
        </div>
      </div>
    </main>
  );
}
