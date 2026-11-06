import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarDays, HeartHandshake, Wallet } from "lucide-react";
import { AppShell, WhiteCard } from "@/components/AppShell";
import { useAccount } from "@/components/AccountProvider";
import { supabase } from "@/integrations/supabase/client";
import { tzs } from "@/lib/club";
import { pageHead } from "@/lib/registration";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageHead("Dashboard", "Overview of your TUCASA Nyerere family, events, readings and contributions."),
  component: Dashboard,
});

function Dashboard() {
  const { user, profile } = useAccount();
  const q = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: async () => {
      const now = new Date().toISOString();
      const [events, readings, contribs, payments, family] = await Promise.all([
        supabase.from("events").select("*").gte("starts_at", now).order("starts_at").limit(5),
        supabase.from("readings").select("id", { count: "exact", head: true }),
        supabase.from("contributions").select("id, amount"),
        supabase.from("payments").select("contribution_id, status").eq("user_id", user!.id),
        supabase.from("family_members").select("group_id, family_groups(name)").eq("user_id", user!.id).maybeSingle(),
      ]);
      const paid = new Set((payments.data ?? []).filter((p) => p.status === "confirmed").map((p) => p.contribution_id));
      const due = (contribs.data ?? []).filter((c) => !paid.has(c.id)).reduce((s, c) => s + Number(c.amount), 0);
      return { events: events.data ?? [], readings: readings.count ?? 0, due, family: (family.data?.family_groups as { name: string } | null)?.name ?? "Not assigned" };
    },
  });
  const d = q.data;
  const stats = [
    { icon: HeartHandshake, label: "My Family", value: d?.family ?? "…", to: "/family" as const },
    { icon: CalendarDays, label: "Upcoming Events", value: d?.events.length ?? "…", to: "/events" as const },
    { icon: Wallet, label: "Outstanding", value: d ? tzs(d.due) : "…", to: "/finance" as const },
    { icon: BookOpen, label: "Readings", value: d?.readings ?? "…", to: "/readings" as const },
  ];
  return (
    <AppShell>
      <div className="flex items-center gap-4 py-4">
        <div className="bg-avatar-gradient flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-glass-border text-2xl font-bold">{profile?.full_name[0]}</div>
        <div className="min-w-0">
          <p className="mb-1 text-xs text-on-ocean/65">Welcome to TUCASA Nyerere Campus</p>
          <h1 className="text-lg font-extrabold">{profile?.full_name}</h1>
          <p className="text-sm text-on-ocean/85">{profile?.course} · Year {profile?.year_of_study}</p>
          <span className="mt-1 inline-block rounded-md border border-glass-border bg-glass px-2 py-0.5 text-xs font-semibold">{profile?.phone}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <WhiteCard key={s.label} className="text-center">
            <s.icon className="mx-auto h-7 w-7" />
            <p className="mt-3 text-sm text-on-ocean/70">{s.label}</p>
            <p className="mt-2 truncate text-xl font-bold">{s.value}</p>
            <Link to={s.to} className="mt-3 inline-block text-sm text-link">View all →</Link>
          </WhiteCard>
        ))}
      </div>
      <WhiteCard>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Upcoming Events</h2><Link to="/events" className="text-sm text-link">View all →</Link></div>
        <div className="space-y-3">
          {d?.events.length === 0 && <p className="text-sm">No upcoming events.</p>}
          {d?.events.map((e) => (
            <div key={e.id} className="rounded-lg border border-glass-border p-3">
              <p className="font-medium">{e.title}</p>
              <p className="text-sm text-on-ocean/75">{new Date(e.starts_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} · {e.location}</p>
            </div>
          ))}
        </div>
      </WhiteCard>
    </AppShell>
  );
}
