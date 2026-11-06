import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CalendarDays, FileText, Users, Wallet } from "lucide-react";
import { AppShell, WhiteCard } from "@/components/AppShell";
import { contributions, currentUser, events, members, tzs } from "@/lib/mock-data";
import { useAccount } from "@/components/AccountProvider";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TUCASA Nyerere Campus" },
      { name: "description", content: "Overview of TUCASA Nyerere Campus members, finances and events." },
      { property: "og:title", content: "Dashboard — TUCASA Nyerere Campus" },
      { property: "og:description", content: "Overview of TUCASA Nyerere Campus members, finances and events." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { profile } = useAccount();
  const total = contributions.reduce((s, c) => s + c.amount, 0);
  const upcoming = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const stats = [
    { icon: Users, label: "Members", value: members.length, to: "/members" as const },
    { icon: CalendarDays, label: "Upcoming Events", value: events.length, to: "/events" as const },
    { icon: Wallet, label: "Contributions", value: tzs(total), to: "/finance" as const },
    { icon: FileText, label: "My Notes", value: 4, to: "/dashboard" as const },
    { icon: BookOpen, label: "Recent Readings", value: 0, to: "/dashboard" as const },
  ];
  return (
    <AppShell>
      <div className="py-4">
        <div className="flex items-center gap-4">
          <div className="bg-avatar-gradient flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-glass-border text-2xl font-bold">
            {(profile?.full_name ?? currentUser.name)[0]}
          </div>
          <div className="min-w-0">
            <p className="mb-1 text-xs text-on-ocean/65">Welcome to TUCASA Nyerere Campus</p>
            <h1 className="text-lg font-extrabold">{profile?.full_name ?? currentUser.name}</h1>
            <p className="text-sm text-on-ocean/85">{profile ? `${profile.course} · Year ${profile.year_of_study}` : "University of Dar es Salaam"}</p>
            <span className="mt-1 inline-block rounded-md border border-glass-border bg-glass px-2 py-0.5 text-xs font-semibold">
              {profile ? profile.phone : `Member ID: ${currentUser.memberId}`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <WhiteCard key={s.label} className="text-center">
            <s.icon className="mx-auto h-7 w-7" />
            <p className="mt-3 text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-xl font-bold">{s.value}</p>
            <Link to={s.to} className="mt-3 inline-block text-sm text-link">View all →</Link>
          </WhiteCard>
        ))}
      </div>

      <WhiteCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upcoming Events</h2>
          <Link to="/events" className="text-sm text-link">View all →</Link>
        </div>
        <div className="space-y-3">
          {upcoming.slice(0, 3).map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
              <div className="min-w-0">
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(e.date).toDateString()} at {e.time}
                </p>
                <p className="text-xs text-muted-foreground">{e.venue}</p>
              </div>
              <span className="shrink-0 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{e.registered} registered</span>
            </div>
          ))}
        </div>
      </WhiteCard>
    </AppShell>
  );
}
