import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AppShell, PageTitle, WhiteCard } from "@/components/AppShell";
import { ConfirmDelete, ExportButtons } from "@/components/ConfirmDelete";
import { useAccount } from "@/components/AccountProvider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { contributionKinds, inputClass, kindLabel, tzs, useIsAdmin } from "@/lib/club";
import { exportExcel, exportPdf } from "@/lib/export";
import { pageHead } from "@/lib/registration";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => pageHead("Finance", "Contributions you owe and payment records confirmed by leadership."),
  component: FinancePage,
});

function FinancePage() {
  const { user } = useAccount(); const { isAdmin } = useIsAdmin(); const qc = useQueryClient();
  const contribs = useQuery({ queryKey: ["contributions"], queryFn: async () => { const { data, error } = await supabase.from("contributions").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });
  const payments = useQuery({ queryKey: ["payments", user?.id, isAdmin], queryFn: async () => { const { data, error } = await supabase.from("payments").select("*, profiles(full_name, phone)").order("created_at", { ascending: false }); if (error) throw error; return data; } });
  const members = useQuery({ queryKey: ["all-members"], enabled: isAdmin, queryFn: async () => { const { data, error } = await supabase.from("profiles").select("*").eq("registration_complete", true).order("full_name"); if (error) throw error; return data; } });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["contributions"] }); qc.invalidateQueries({ queryKey: ["payments"] }); };
  const [form, setForm] = useState({ title: "", kind: "membership", amount: "", due_date: "" });
  const [rec, setRec] = useState({ contribution_id: "", user_id: "", reference: "" });
  const [selected, setSelected] = useState<string>("");

  const mine = (payments.data ?? []).filter((p) => p.user_id === user?.id);
  const myStatus = (cid: string) => mine.find((p) => p.contribution_id === cid);

  async function createContribution(e: FormEvent) {
    e.preventDefault(); const amount = Number(form.amount);
    if (form.title.trim().length < 2 || !(amount > 0)) return void toast.error("Enter a title and amount.");
    const { error } = await supabase.from("contributions").insert({ title: form.title.trim(), kind: form.kind, amount, due_date: form.due_date || null });
    if (error) return void toast.error("Could not save."); setForm({ title: "", kind: "membership", amount: "", due_date: "" }); refresh();
  }
  async function markPaid(cid: string, amount: number) {
    const reference = window.prompt("Payment reference (e.g. M-Pesa transaction code)") ?? "";
    const { error } = await supabase.from("payments").insert({ contribution_id: cid, user_id: user!.id, amount, reference: reference.trim() || null });
    if (error) toast.error("Could not submit."); else { toast.success("Submitted. Waiting for leadership to confirm."); refresh(); }
  }
  async function confirm(id: string) { const { error } = await supabase.from("payments").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", id); if (error) toast.error("Could not confirm."); else refresh(); }
  async function record(e: FormEvent) {
    e.preventDefault(); const c = contribs.data?.find((x) => x.id === rec.contribution_id);
    if (!c || !rec.user_id) return void toast.error("Choose a contribution and member.");
    const { error } = await supabase.from("payments").upsert({ contribution_id: c.id, user_id: rec.user_id, amount: c.amount, reference: rec.reference || null, status: "confirmed", confirmed_at: new Date().toISOString() }, { onConflict: "contribution_id,user_id" });
    if (error) toast.error("Could not record."); else { toast.success("Payment recorded."); setRec({ ...rec, user_id: "", reference: "" }); refresh(); }
  }
  const delContribution = async (id: string) => { const { error } = await supabase.from("contributions").delete().eq("id", id); if (error) toast.error("Could not delete."); else refresh(); };
  const delPayment = async (id: string) => { const { error } = await supabase.from("payments").delete().eq("id", id); if (error) toast.error("Could not delete."); else refresh(); };

  const pending = (payments.data ?? []).filter((p) => p.status === "pending");
  const selC = contribs.data?.find((c) => c.id === selected);
  const selPayments = (payments.data ?? []).filter((p) => p.contribution_id === selected);
  const headers = ["#", "Member", "Phone", "Amount", "Reference", "Status", "Date"];
  const rows = () => selPayments.map((p, i) => [i + 1, p.profiles?.full_name ?? "", p.profiles?.phone ?? "", Number(p.amount), p.reference ?? "", p.status, new Date(p.created_at).toLocaleDateString()]);
  const totalConfirmed = (payments.data ?? []).filter((p) => p.status === "confirmed").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <AppShell>
      <PageTitle title="Finance" subtitle={isAdmin ? `Confirmed collections: ${tzs(totalConfirmed)}` : "Your contributions"} />
      <WhiteCard>
        <h2 className="mb-3 font-semibold">My contributions</h2>
        <div className="space-y-2">
          {contribs.data?.length === 0 && <p className="text-sm">No contributions set yet.</p>}
          {contribs.data?.map((c) => { const p = myStatus(c.id); return (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-glass-border p-3">
              <div><p className="font-medium">{c.title}</p><p className="text-xs text-on-ocean/70">{kindLabel(c.kind)}{c.due_date ? ` · Due ${c.due_date}` : ""}</p></div>
              <div className="flex items-center gap-3"><span className="font-semibold">{tzs(c.amount)}</span>
                {p?.status === "confirmed" ? <span className="rounded-md bg-chart-2/25 px-2 py-1 text-xs font-semibold">Paid ✓</span>
                  : p ? <span className="rounded-md bg-chart-4/25 px-2 py-1 text-xs font-semibold">Awaiting confirmation</span>
                  : <Button size="sm" onClick={() => markPaid(c.id, Number(c.amount))}>I have paid</Button>}
              </div>
            </div>); })}
        </div>
      </WhiteCard>

      {isAdmin && (<>
        <div className="grid gap-4 lg:grid-cols-2">
          <WhiteCard>
            <h2 className="mb-3 font-semibold">Set a contribution</h2>
            <form onSubmit={createContribution} className="space-y-3">
              <input className={inputClass} placeholder="Title (e.g. Membership fee 2026)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <select className={inputClass} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>{contributionKinds.filter((k) => k.id !== "event").map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</select>
              <div className="grid grid-cols-2 gap-3"><input className={inputClass} type="number" min="1" placeholder="Amount (TZS)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /><input className={inputClass} type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              <Button className="w-full">Save contribution</Button>
            </form>
          </WhiteCard>
          <WhiteCard>
            <h2 className="mb-3 font-semibold">Record a payment</h2>
            <form onSubmit={record} className="space-y-3">
              <select className={inputClass} value={rec.contribution_id} onChange={(e) => setRec({ ...rec, contribution_id: e.target.value })}><option value="">Choose contribution</option>{contribs.data?.map((c) => <option key={c.id} value={c.id}>{c.title} — {tzs(c.amount)}</option>)}</select>
              <select className={inputClass} value={rec.user_id} onChange={(e) => setRec({ ...rec, user_id: e.target.value })}><option value="">Choose member</option>{members.data?.map((m) => <option key={m.id} value={m.id}>{m.full_name} ({m.phone})</option>)}</select>
              <input className={inputClass} placeholder="Reference (optional)" value={rec.reference} onChange={(e) => setRec({ ...rec, reference: e.target.value })} />
              <Button className="w-full">Record as paid</Button>
            </form>
          </WhiteCard>
        </div>

        <WhiteCard>
          <h2 className="mb-3 font-semibold">Pending confirmations ({pending.length})</h2>
          <div className="space-y-2">
            {pending.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-glass-border p-3">
                <div><p className="font-medium">{p.profiles?.full_name}</p><p className="text-xs text-on-ocean/70">{contribs.data?.find((c) => c.id === p.contribution_id)?.title} · {tzs(p.amount)}{p.reference ? ` · Ref ${p.reference}` : ""}</p></div>
                <div className="flex gap-1"><Button size="sm" onClick={() => confirm(p.id)}>Confirm</Button><ConfirmDelete what="this payment claim" onConfirm={() => delPayment(p.id)} /></div>
              </div>
            ))}
            {pending.length === 0 && <p className="text-sm">Nothing waiting.</p>}
          </div>
        </WhiteCard>

        <WhiteCard>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Contribution records</h2>
            <select className={inputClass + " max-w-xs"} value={selected} onChange={(e) => setSelected(e.target.value)}><option value="">Choose contribution</option>{contribs.data?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
          </div>
          {selC && (<>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm">{selPayments.filter((p) => p.status === "confirmed").length} paid · {tzs(selPayments.filter((p) => p.status === "confirmed").reduce((s, p) => s + Number(p.amount), 0))} collected</p>
              <div className="flex gap-2"><ExportButtons onPdf={() => exportPdf(selC.title, headers, rows())} onExcel={() => exportExcel(selC.title, headers, rows())} />{selC.kind !== "event" && <ConfirmDelete what={selC.title} onConfirm={async () => { await delContribution(selC.id); setSelected(""); }} />}</div>
            </div>
            <div className="space-y-2">{selPayments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-glass-border p-3">
                <div><p className="font-medium">{p.profiles?.full_name}</p><p className="text-xs text-on-ocean/70">{p.status === "confirmed" ? "Confirmed" : "Pending"} · {new Date(p.created_at).toLocaleDateString()}</p></div>
                <div className="flex items-center gap-1"><span className="font-semibold">{tzs(p.amount)}</span><ConfirmDelete what="this payment record" onConfirm={() => delPayment(p.id)} /></div>
              </div>))}</div>
          </>)}
        </WhiteCard>
      </>)}
    </AppShell>
  );
}
