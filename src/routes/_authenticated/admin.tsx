import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageTitle, WhiteCard } from "@/components/AppShell";
import { members } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — TUCASA Nyerere Campus" },
      { name: "description", content: "Leadership controls for settings and user roles." },
      { property: "og:title", content: "Admin — TUCASA Nyerere Campus" },
      { property: "og:description", content: "Leadership controls for settings and user roles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const roles = ["Member", "Secretary", "Treasurer", "Chairperson", "Admin"];

function AdminPage() {
  const [userRoles, setUserRoles] = useState<Record<number, string>>({ 237: "Admin", 239: "Treasurer", 242: "Secretary" });
  const [settings, setSettings] = useState({ registration: true, notifications: true, maintenance: false });
  return (
    <AppShell>
      <PageTitle title="Admin Controls" subtitle="Manage system settings and leadership roles" />
      <div className="grid gap-4 lg:grid-cols-3">
        <WhiteCard>
          <h2 className="mb-3 font-semibold">System Settings</h2>
          {(Object.keys(settings) as (keyof typeof settings)[]).map((k) => (
            <label key={k} className="flex items-center justify-between border-b py-3 text-sm capitalize last:border-0">
              {k === "registration" ? "Open registration" : k === "notifications" ? "Notifications" : "Maintenance mode"}
              <input type="checkbox" className="h-4 w-4" checked={settings[k]} onChange={(e) => setSettings({ ...settings, [k]: e.target.checked })} />
            </label>
          ))}
        </WhiteCard>
        <WhiteCard className="lg:col-span-2">
          <h2 className="mb-3 font-semibold">User Roles</h2>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">ID {m.id}</p>
                </div>
                <select
                  className="rounded-md border bg-background px-2 py-1 text-sm"
                  value={userRoles[m.id] ?? "Member"}
                  onChange={(e) => setUserRoles({ ...userRoles, [m.id]: e.target.value })}
                >
                  {roles.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            ))}
          </div>
        </WhiteCard>
      </div>
    </AppShell>
  );
}
