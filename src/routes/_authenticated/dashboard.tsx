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
      <section className="relative overflow-hidden rounded-2xl border border-glass-border bg-glass p-4 backdrop-blur-md sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-avatar-gradient opacity-30 blur-2xl" />
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="bg-avatar-gradient flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-glass-border text-xl font-bold shadow-lg sm:h-16 sm:w-16 sm:text-2xl">{profile?.full_name[0]}</div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-widest text-on-ocean/60">{greeting()}</p>
            <h1 className="truncate text-base font-extrabold sm:text-xl">{profile?.full_name}</h1>
            <p className="truncate text-xs text-on-ocean/80 sm:text-sm">{profile?.course}</p>
          </div>
        </div>
        <div className="relative mt-3 flex flex-wrap gap-2 text-[11px] font-semibold sm:text-xs">
          <span className="rounded-full border border-glass-border bg-glass px-2.5 py-0.5">Year {profile?.year_of_study}</span>
          <span className="rounded-full border border-glass-border bg-glass px-2.5 py-0.5">{profile?.phone}</span>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-glass-border bg-glass p-3 backdrop-blur-md transition hover:bg-glass/80 sm:p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-avatar-gradient sm:h-10 sm:w-10"><s.icon className="h-4 w-4 sm:h-5 sm:w-5" /></span>
            <span className="min-w-0">
              <span className="block truncate text-[11px] text-on-ocean/70 sm:text-xs">{s.label}</span>
              <span className="block truncate text-sm font-bold sm:text-base">{s.value}</span>
            </span>
          </Link>
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

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
