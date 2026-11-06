import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, PageTitle, WhiteCard } from "@/components/AppShell";
import { ExportButtons } from "@/components/ConfirmDelete";
import { useAccount } from "@/components/AccountProvider";
import { supabase } from "@/integrations/supabase/client";
import { genderLabel, inputClass, useIsAdmin } from "@/lib/club";
import { exportExcel, exportPdf } from "@/lib/export";
import { pageHead } from "@/lib/registration";

export const Route = createFileRoute("/_authenticated/members")({
  head: () => pageHead("Members", "Your member details and the TUCASA Nyerere member register."),
  component: MembersPage,
});

function MembersPage() {
  const { profile } = useAccount();
  const { isAdmin } = useIsAdmin();
  const [q, setQ] = useState("");
  const all = useQuery({
    queryKey: ["all-members"], enabled: isAdmin,
    queryFn: async () => { const { data, error } = await supabase.from("profiles").select("*").eq("registration_complete", true).order("full_name"); if (error) throw error; return data; },
  });
  const list = (all.data ?? []).filter((m) => [m.full_name, m.course, m.phone, m.church].join(" ").toLowerCase().includes(q.toLowerCase()));
  const headers = ["#", "Name", "Phone", "Gender", "Course", "Year", "Baptized", "Church"];
  const rows = () => list.map((m, i) => [i + 1, m.full_name, m.phone, genderLabel(m.gender), m.course ?? "", m.year_of_study ?? "", m.baptized ? "Yes" : "No", m.church ?? ""]);
  const info: [string, string][] = profile ? [["Full name", profile.full_name], ["Phone", profile.phone], ["Gender", genderLabel(profile.gender)], ["Course", profile.course ?? "—"], ["Course duration", `${profile.course_duration ?? "—"} years`], ["Year of study", String(profile.year_of_study ?? "—")], ["Baptized", profile.baptized ? "Yes" : "No"], ["Church", profile.church ?? "—"]] : [];
  return (
    <AppShell>
      <PageTitle title="Members" subtitle={isAdmin ? `${all.data?.length ?? 0} registered members` : "Your membership details"} />
      <WhiteCard>
        <h2 className="mb-3 font-semibold">My details</h2>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {info.map(([k, v]) => <div key={k} className="rounded-lg border border-glass-border p-3"><dt className="text-xs text-on-ocean/65">{k}</dt><dd className="mt-1 font-medium">{v}</dd></div>)}
        </dl>
      </WhiteCard>
      {isAdmin && (
        <WhiteCard>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">All members</h2>
            <ExportButtons onPdf={() => exportPdf("Members", headers, rows())} onExcel={() => exportExcel("Members", headers, rows())} />
          </div>
          <input className={inputClass + " mb-3"} placeholder="Search by name, course, phone or church" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="space-y-2">
            {list.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-glass-border p-3">
                <div className="min-w-0"><p className="font-medium">{m.full_name}</p><p className="text-xs text-on-ocean/70">{m.course} · Year {m.year_of_study} · {genderLabel(m.gender)}</p></div>
                <a href={`tel:${m.phone}`} className="text-sm text-link">{m.phone}</a>
              </div>
            ))}
            {!all.isPending && list.length === 0 && <p className="text-sm text-on-ocean/70">No members found.</p>}
          </div>
        </WhiteCard>
      )}
    </AppShell>
  );
}
