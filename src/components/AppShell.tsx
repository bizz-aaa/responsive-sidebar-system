import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, CalendarDays, Home, Menu, Shield, Users, Wallet, X, LogOut } from "lucide-react";
import { currentUser } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { BrandLogos } from "./BrandLogos";
import { useAccount } from "./AccountProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/members", label: "Members", icon: Users },
  { to: "/finance", label: "Finance", icon: Wallet },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/admin", label: "Admin", icon: Shield },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, loading, error, retry } = useAccount(); const queryClient = useQueryClient(); const navigate = useNavigate();
  async function signOut() { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true }); }
  useEffect(() => { if (!loading && user && profile && !profile.registration_complete) void navigate({ to: "/complete-registration", replace: true }); }, [loading, user, profile, navigate]);
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setOpen(false), [path]);

  const links = (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map((n) => {
        const active = n.to === "/dashboard" ? path === "/dashboard" : path.startsWith(n.to);
        return (
          <Link
            key={n.to}
            to={n.to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-glass text-on-ocean border border-glass-border" : "text-on-ocean/75 hover:bg-glass hover:text-on-ocean border border-transparent"
            }`}
          >
            <n.icon className="h-5 w-5" />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-ocean-gradient text-on-ocean">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-glass-border bg-ocean-deep/80 px-4 backdrop-blur">
        <Button
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md bg-glass p-2 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden sm:block"><BrandLogos /></div>
        <div className="min-w-0"><span className="block text-lg font-bold">TUCASA <span className="font-normal text-on-ocean/70">TNC</span></span><span className="hidden text-xs text-on-ocean/70 md:block">Nyerere Campus Management System</span></div>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full bg-glass px-2.5 py-1 text-xs sm:flex">
            <span className="h-2 w-2 rounded-full bg-chart-2" /> Online
          </span>
          <Button aria-label="Notifications" className="relative rounded-md bg-glass p-2">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px]">3</span>
          </Button>
          <span className="bg-avatar-gradient hidden h-8 w-8 items-center justify-center rounded-md text-sm font-bold sm:flex">
            {(profile?.full_name ?? currentUser.name)[0]}
          </span>
          {user ? <Button variant="ghost" onClick={signOut} className="border border-glass-border bg-glass text-on-ocean"><LogOut /><span className="hidden sm:inline">Sign out</span></Button> : <Button asChild className="border border-glass-border bg-glass text-on-ocean"><Link to="/auth">Sign in</Link></Button>}
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r border-glass-border bg-ocean-deep/40 lg:block">
          {links}
        </aside>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-ocean-deep/60" onClick={() => setOpen(false)} />
            <aside className="relative h-full w-64 bg-ocean-deep shadow-xl">
              <div className="flex h-16 items-center justify-between border-b border-glass-border px-4">
                <span className="font-bold">TUCASA TNC</span>
                <Button aria-label="Close menu" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {links}
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-6xl space-y-4">{loading ? <div role="status" className="py-16 text-center">Loading your account…</div> : error ? <div role="alert" className="py-16 text-center"><p className="mb-4">Unable to load your account.</p><Button onClick={retry}>Try again</Button></div> : user && profile && !profile.registration_complete ? <div className="py-12"><h1 className="mb-4 text-2xl font-bold">Complete your registration</h1><Button asChild><Link to="/complete-registration">Complete registration</Link></Button></div> : children}</div>
        </main>
      </div>
    </div>
  );
}

export function WhiteCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-glass-border bg-glass p-5 text-on-ocean ${className}`}>{children}</div>;
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-glass-border py-6">
      <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-on-ocean/75">{subtitle}</p>}
    </div>
  );
}
