import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, PageTitle, WhiteCard } from "@/components/AppShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { inputClass, useIsAdmin } from "@/lib/club";
import { pageHead } from "@/lib/registration";

export const Route = createFileRoute("/_authenticated/leadership")({
  head: () => pageHead("Leadership", "Adcom and Excom leaders of TUCASA Nyerere Campus."),
  component: LeadershipPage,
});

const bodies = [{ id: "adcom", label: "Adcom" }, { id: "excom", label: "Excom" }] as const;

function LeadershipPage() {
  const { isAdmin, loading } = useIsAdmin(); const qc = useQueryClient();
  const positions = useQuery({ queryKey: ["positions"], queryFn: async () => { const { data, error } = await supabase.from("leadership_positions").select("*").order("created_at"); if (error) throw error; return data; } });
  const leaders = useQuery({ queryKey: ["leaders"], queryFn: async () => { const { data, error } = await supabase.from("leaders").select("*").order("created_at"); if (error) throw error; return data; } });
  const members = useQuery({ queryKey: ["all-members"], enabled: isAdmin, queryFn: async () => { const { data, error } = await supabase.from("profiles").select("*").eq("registration_complete", true).order("full_name"); if (error) throw error; return data; } });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["positions"] }); qc.invalidateQueries({ queryKey: ["leaders"] }); qc.invalidateQueries({ queryKey: ["is-admin"] }); };
  const [newPos, setNewPos] = useState<Record<string, { title: string; is_admin: boolean }>>({ adcom: { title: "", is_admin: true }, excom: { title: "", is_admin: false } });
  const [pick, setPick] = useState<Record<string, string>>({});
  const noAdmins = !leaders.isPending && !positions.isPending && !(leaders.data ?? []).some((l) => positions.data?.find((p) => p.id === l.position_id)?.is_admin);

  async function claim() { const { data, error } = await supabase.rpc("claim_first_admin"); if (error || !data) toast.error("Could not claim."); else { toast.success("You are now an admin."); refresh(); } }
  async function addPosition(body: string) {
    const p = newPos[body]!; if (p.title.trim().length < 2) return void toast.error("Enter a position title.");
    const { error } = await supabase.from("leadership_positions").insert({ body, title: p.title.trim(), is_admin: p.is_admin });
    if (error) toast.error("Could not add position."); else { setNewPos({ ...newPos, [body]: { ...p, title: "" } }); refresh(); }
  }
  async function addLeader(positionId: string) {
    const m = members.data?.find((x) => x.id === pick[positionId]); if (!m) return void toast.error("Choose a member.");
    const { error } = await supabase.from("leaders").insert({ position_id: positionId, user_id: m.id, leader_name: m.full_name, leader_phone: m.phone });
    if (error) toast.error(error.code === "23505" ? "Already holds this position." : "Could not add leader."); else { setPick({ ...pick, [positionId]: "" }); refresh(); }
  }
  const toggleAdmin = async (id: string, v: boolean) => { const { error } = await supabase.from("leadership_positions").update({ is_admin: v }).eq("id", id); if (error) toast.error("Could not update."); else refresh(); };
  const delLeader = async (id: string) => { const { error } = await supabase.from("leaders").delete().eq("id", id); if (error) toast.error("Could not remove."); else refresh(); };
  const delPosition = async (id: string) => { const { error } = await supabase.from("leadership_positions").delete().eq("id", id); if (error) toast.error("Could not delete."); else refresh(); };

  return (
    <AppShell>
      <PageTitle icon={Shield} title="Leadership" subtitle="Positions marked Full admin can manage the whole system" />
      {noAdmins && !loading && (
        <WhiteCard><p className="mb-3 text-sm">No admin has been set yet. The first leader to claim becomes Chairperson and full admin.</p><Button onClick={claim}><ShieldCheck />Claim admin access</Button></WhiteCard>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {bodies.map((b) => (
          <WhiteCard key={b.id}>
            <h2 className="mb-4 text-lg font-bold">{b.label}</h2>
            <div className="space-y-3">
              {positions.data?.filter((p) => p.body === b.id).map((p) => (
                <div key={p.id} className="rounded-lg border border-glass-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{p.title} {p.is_admin && <span className="ml-1 rounded bg-chart-2/25 px-1.5 py-0.5 text-xs">Full admin</span>}</p>
                    {isAdmin && <div className="flex items-center gap-1"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={p.is_admin} onChange={(e) => toggleAdmin(p.id, e.target.checked)} />Admin</label><ConfirmDelete what={`position ${p.title}`} onConfirm={() => delPosition(p.id)} /></div>}
                  </div>
                  <ul className="mt-2 space-y-1">
                    {leaders.data?.filter((l) => l.position_id === p.id).map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-2 text-sm"><span>{l.leader_name} <span className="text-on-ocean/60">{l.leader_phone}</span></span>{isAdmin && <ConfirmDelete what={`${l.leader_name} as ${p.title}`} onConfirm={() => delLeader(l.id)} />}</li>
                    ))}
                    {!leaders.data?.some((l) => l.position_id === p.id) && <li className="text-xs text-on-ocean/60">Vacant</li>}
                  </ul>
                  {isAdmin && (
                    <div className="mt-2 flex gap-2">
                      <select className={inputClass + " h-9"} value={pick[p.id] ?? ""} onChange={(e) => setPick({ ...pick, [p.id]: e.target.value })}><option value="">Add leader…</option>{members.data?.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}</select>
                      <Button size="sm" onClick={() => addLeader(p.id)}>Add</Button>
                    </div>
                  )}
                </div>
              ))}
              {isAdmin && (
                <div className="flex flex-wrap gap-2 border-t border-glass-border pt-3">
                  <input className={inputClass + " h-9 flex-1"} placeholder={`New ${b.label} position`} value={newPos[b.id]!.title} onChange={(e) => setNewPos({ ...newPos, [b.id]: { ...newPos[b.id]!, title: e.target.value } })} />
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={newPos[b.id]!.is_admin} onChange={(e) => setNewPos({ ...newPos, [b.id]: { ...newPos[b.id]!, is_admin: e.target.checked } })} />Full admin</label>
                  <Button size="sm" onClick={() => addPosition(b.id)}>Add position</Button>
                </div>
              )}
            </div>
          </WhiteCard>
        ))}
      </div>
    </AppShell>
  );
}
