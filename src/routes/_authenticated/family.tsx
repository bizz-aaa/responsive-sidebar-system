import { HeartHandshake as HeartHandshake } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Phone } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, PageTitle, WhiteCard } from "@/components/AppShell";
import { ConfirmDelete, ExportButtons } from "@/components/ConfirmDelete";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/components/AccountProvider";
import { supabase } from "@/integrations/supabase/client";
import { genderLabel, useIsAdmin } from "@/lib/club";
import { exportExcel, exportPdf } from "@/lib/export";
import { pageHead } from "@/lib/registration";

export const Route = createFileRoute("/_authenticated/family")({
  head: () => pageHead("Family Groups", "Your TUCASA family group and fellow members."),
  component: FamilyPage,
});

type Row = { group_id: string; user_id: string; is_leader: boolean; family_groups: { name: string } | null; profiles: { full_name: string; phone: string; gender: string | null; year_of_study: number | null } | null };

function FamilyPage() {
  const { user } = useAccount(); const { isAdmin } = useIsAdmin(); const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["family", user?.id, isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase.from("family_members").select("group_id, user_id, is_leader, family_groups(name), profiles(full_name, phone, gender, year_of_study)").order("joined_at");
      if (error) throw error; return data as unknown as Row[];
    },
  });
  const rows = q.data ?? [];
  const groups = new Map<string, { name: string; members: Row[] }>();
  rows.forEach((r) => { const g = groups.get(r.group_id) ?? { name: r.family_groups?.name ?? "Family", members: [] }; g.members.push(r); groups.set(r.group_id, g); });
  const mine = rows.find((r) => r.user_id === user?.id)?.group_id;
  const sorted = [...groups.entries()].sort(([a], [b]) => (a === mine ? -1 : b === mine ? 1 : 0));
  const refresh = () => qc.invalidateQueries({ queryKey: ["family"] });

  const headers = ["Family", "Name", "Role", "Phone", "Gender", "Year"];
  const exportRows = () => sorted.flatMap(([, g]) => g.members.map((m) => [g.name, m.profiles?.full_name ?? "", m.is_leader ? "Leader" : "Member", m.profiles?.phone ?? "", genderLabel(m.profiles?.gender ?? null), m.profiles?.year_of_study ?? ""]));

  async function assignAll() { const { data, error } = await supabase.rpc("assign_unassigned_members"); if (error) toast.error("Could not assign members."); else { toast.success(`${data} member(s) assigned.`); refresh(); } }
  async function makeLeader(groupId: string, userId: string) {
    await supabase.from("family_members").update({ is_leader: false }).eq("group_id", groupId);
    const { error } = await supabase.from("family_members").update({ is_leader: true }).eq("group_id", groupId).eq("user_id", userId);
    if (error) toast.error("Could not change leader."); else refresh();
  }
  async function removeMember(userId: string) { const { error } = await supabase.from("family_members").delete().eq("user_id", userId); if (error) toast.error("Could not remove member."); else refresh(); }
  async function removeGroup(id: string) { const { error } = await supabase.from("family_groups").delete().eq("id", id); if (error) toast.error("Could not delete group."); else refresh(); }

  return (
    <AppShell>
      <PageTitle icon={HeartHandshake} title="Family Groups" subtitle="Groups of five mixing gender and year of study, formed automatically as members register." />
      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" className="border-glass-border bg-glass text-on-ocean" onClick={assignAll}>Assign unassigned members</Button>
          <ExportButtons onPdf={() => exportPdf("Family Groups", headers, exportRows())} onExcel={() => exportExcel("Family Groups", headers, exportRows())} />
        </div>
      )}
      {q.isPending ? <p>Loading…</p> : sorted.length === 0 ? (
        <WhiteCard><p>You have not been placed in a family group yet. Groups are formed once you complete registration.</p></WhiteCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map(([id, g]) => (
            <WhiteCard key={id} className={id === mine ? "ring-2 ring-ring" : ""}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div><h2 className="font-semibold">{g.name}</h2><p className="text-xs text-on-ocean/70">{g.members.length}/5 members{id === mine ? " · Your family" : ""}</p></div>
                {isAdmin && <ConfirmDelete what={g.name} onConfirm={() => removeGroup(id)} />}
              </div>
              <ul className="space-y-2">
                {g.members.map((m) => (
                  <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-glass-border p-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-medium">{m.is_leader && <Crown className="h-4 w-4 text-chart-4" aria-label="Leader" />}{m.profiles?.full_name}</p>
                      <p className="text-xs text-on-ocean/70">{genderLabel(m.profiles?.gender ?? null)} · Year {m.profiles?.year_of_study}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <a href={`tel:${m.profiles?.phone}`} className="flex items-center gap-1 text-sm text-link"><Phone className="h-3.5 w-3.5" />{m.profiles?.phone}</a>
                      {isAdmin && !m.is_leader && <Button size="sm" variant="ghost" onClick={() => makeLeader(id, m.user_id)}>Make leader</Button>}
                      {isAdmin && <ConfirmDelete what={`${m.profiles?.full_name} from ${g.name}`} onConfirm={() => removeMember(m.user_id)} />}
                    </div>
                  </li>
                ))}
              </ul>
            </WhiteCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}
