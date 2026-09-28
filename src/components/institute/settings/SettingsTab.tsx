import { Pill, Surface } from "@/components/shared";
import { getSettings } from "@/services/institute";
import type { SessionUser } from "@/types/arena";

export function SettingsTab({ user }: { user: SessionUser }) {
  const { institute, me, team } = getSettings(user);
  const isAdmin = me?.role === "admin";

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-medium">Settings</h1>
      <Surface className="p-6">
        <h2 className="font-medium">Institute</h2>
        <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <p>{institute.name} · {institute.slug}</p>
          <p>Plan: {institute.plan} · Status: {institute.status}</p>
          <p>Pass bar: {institute.pass_bar} · CEO threshold: {institute.ceo_threshold}</p>
        </div>
      </Surface>
      <Surface className="p-6">
        <h2 className="font-medium">Team</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAdmin ? "You are an admin — you can decide restart requests and manage the team." : "You are a viewer — read-only access to this workspace."}
        </p>
        <div className="mt-4 space-y-3">
          {team.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-xl bg-secondary/40 p-4 text-sm">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
              <Pill tone={member.role === "admin" ? "sage" : "neutral"}>{member.role}</Pill>
            </div>
          ))}
        </div>
      </Surface>
    </section>
  );
}
