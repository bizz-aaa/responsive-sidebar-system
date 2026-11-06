import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { CalendarDays, Link2, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, PageTitle, WhiteCard } from "@/components/AppShell";
import { ConfirmDelete, ExportButtons } from "@/components/ConfirmDelete";
import { EventRegistrationForm } from "@/components/EventRegistrationForm";
import { useAccount } from "@/components/AccountProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { inputClass, tzs, useIsAdmin } from "@/lib/club";
import { exportExcel, exportPdf } from "@/lib/export";
import { pageHead } from "@/lib/registration";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => pageHead("Events", "Create events, register members and track event contributions."),
  component: EventsPage,
});

function EventsPage() {
  const { user, profile } = useAccount(); const { isAdmin } = useIsAdmin(); const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", location: "", starts_at: "", amount: "" });
  const [registerFor, setRegisterFor] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const events = useQuery({ queryKey: ["events"], queryFn: async () => { const { data, error } = await supabase.from("events").select("*").order("starts_at"); if (error) throw error; return data; } });
  const regs = useQuery({ queryKey: ["event-regs", user?.id, isAdmin], queryFn: async () => { const { data, error } = await supabase.from("event_registrations").select("*").order("created_at"); if (error) throw error; return data; } });
  const counts = useQuery({ queryKey: ["event-counts", events.data?.map((e) => e.id).join()], enabled: Boolean(events.data), queryFn: async () => Object.fromEntries(await Promise.all(events.data!.map(async (e) => [e.id, (await supabase.rpc("event_registration_count", { _event: e.id })).data ?? 0] as const))) });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["events"] }); qc.invalidateQueries({ queryKey: ["event-regs"] }); qc.invalidateQueries({ queryKey: ["event-counts"] }); qc.invalidateQueries({ queryKey: ["contributions"] }); };

  async function create(e: FormEvent) {
    e.preventDefault();
    if (form.title.trim().length < 2 || !form.location.trim() || !form.starts_at) return void toast.error("Fill in name, location and time.");
    const { error } = await supabase.from("events").insert({ title: form.title.trim(), location: form.location.trim(), starts_at: new Date(form.starts_at).toISOString(), contribution_amount: Number(form.amount) || 0 });
    if (error) return void toast.error("Could not create event.");
    setForm({ title: "", location: "", starts_at: "", amount: "" }); toast.success("Event created."); refresh();
  }
  const share = async (id: string) => { const url = `${window.location.origin}/register/${id}`; try { if (navigator.share) await navigator.share({ title: "Register for event", url }); else { await navigator.clipboard.writeText(url); toast.success("Registration link copied."); } } catch { await navigator.clipboard.writeText(url).catch(() => {}); } };
  const remove = async (id: string) => { const { error } = await supabase.from("events").delete().eq("id", id); if (error) toast.error("Could not delete."); else refresh(); };
  const togglePaid = async (id: string, paid: boolean) => { const { error } = await supabase.from("event_registrations").update({ paid }).eq("id", id); if (error) toast.error("Could not update."); else refresh(); };
  const removeReg = async (id: string) => { const { error } = await supabase.from("event_registrations").delete().eq("id", id); if (error) toast.error("Could not delete."); else refresh(); };

  const viewEvent = events.data?.find((e) => e.id === viewing);
  const viewRegs = (regs.data ?? []).filter((r) => r.event_id === viewing);
  const headers = ["#", "Name", "Phone", "Residence", "Year", "Paid", "Registered"];
  const rows = () => viewRegs.map((r, i) => [i + 1, r.full_name, r.phone, r.residence, r.year_of_study, r.paid ? "Yes" : "No", new Date(r.created_at).toLocaleDateString()]);

  return (
    <AppShell>
      <PageTitle icon={CalendarDays} title="Events" subtitle="Register for events and share the link with others" />
      <div className="grid gap-4 lg:grid-cols-3">
        {isAdmin && (
          <WhiteCard>
            <h2 className="mb-3 font-semibold">Create event</h2>
            <form onSubmit={create} className="space-y-3">
              <input className={inputClass} placeholder="Event name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input className={inputClass} placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <input className={inputClass} type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
              <input className={inputClass} type="number" min="0" placeholder="Contribution per member (TZS)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <Button className="w-full">Create event</Button>
            </form>
          </WhiteCard>
        )}
        <div className={`grid gap-4 md:grid-cols-2 ${isAdmin ? "lg:col-span-2" : "lg:col-span-3 xl:grid-cols-3"}`}>
          {events.data?.length === 0 && <div className="md:col-span-2 xl:col-span-3"><EmptyState icon={CalendarDays} title="No events yet" text="Upcoming events will appear here." /></div>}
          {events.data?.map((ev) => {
            const mine = regs.data?.some((r) => r.event_id === ev.id && r.user_id === user?.id);
            return (
              <WhiteCard key={ev.id} className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{ev.title}</h3>{isAdmin && <ConfirmDelete what={ev.title} onConfirm={() => remove(ev.id)} />}</div>
                <p className="flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4" />{new Date(ev.starts_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
                <p className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" />{ev.location}</p>
                <p className="flex items-center gap-2 text-sm"><Users className="h-4 w-4" />{counts.data?.[ev.id] ?? 0} registered{Number(ev.contribution_amount) > 0 && ` · ${tzs(ev.contribution_amount)}`}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  {mine ? <span className="rounded-md bg-chart-2/20 px-3 py-1.5 text-sm font-semibold">Registered ✓</span> : <Button size="sm" onClick={() => setRegisterFor(ev.id)}>Register</Button>}
                  <Button size="sm" variant="outline" className="border-glass-border bg-glass text-on-ocean" onClick={() => share(ev.id)}><Link2 />Share link</Button>
                  {isAdmin && <Button size="sm" variant="outline" className="border-glass-border bg-glass text-on-ocean" onClick={() => setViewing(ev.id)}>Registrations</Button>}
                </div>
              </WhiteCard>
            );
          })}
        </div>
      </div>

      <Dialog open={Boolean(registerFor)} onOpenChange={(o) => !o && setRegisterFor(null)}>
        <DialogContent className="border-glass-border bg-ocean-deep text-on-ocean">
          <DialogHeader><DialogTitle>Register for event</DialogTitle></DialogHeader>
          {registerFor && <EventRegistrationForm eventId={registerFor} userId={user?.id ?? null} defaults={{ full_name: profile?.full_name ?? "", phone: profile?.phone ?? "", year_of_study: String(profile?.year_of_study ?? 1) }} onDone={() => { setRegisterFor(null); toast.success("You are registered."); refresh(); }} />}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewing)} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto border-glass-border bg-ocean-deep text-on-ocean sm:max-w-2xl">
          <DialogHeader><DialogTitle>{viewEvent?.title} — {viewRegs.length} registered</DialogTitle></DialogHeader>
          <ExportButtons onPdf={() => exportPdf(`${viewEvent?.title} registrations`, headers, rows())} onExcel={() => exportExcel(`${viewEvent?.title} registrations`, headers, rows())} />
          <div className="space-y-2">
            {viewRegs.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-glass-border p-3">
                <div><p className="font-medium">{r.full_name}</p><p className="text-xs text-on-ocean/70">{r.phone} · {r.residence} · Year {r.year_of_study}</p></div>
                <div className="flex items-center gap-2">
                  {Number(viewEvent?.contribution_amount) > 0 && <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={r.paid} onChange={(e) => togglePaid(r.id, e.target.checked)} />Paid</label>}
                  <ConfirmDelete what={`registration of ${r.full_name}`} onConfirm={() => removeReg(r.id)} />
                </div>
              </div>
            ))}
            {viewRegs.length === 0 && <p className="text-sm">No registrations yet.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
