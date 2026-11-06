import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AppShell, PageTitle, WhiteCard } from "@/components/AppShell";
import { members as seed, type Member } from "@/lib/mock-data";

export const Route = createFileRoute("/members")({
  head: () => ({
    meta: [
      { title: "Members — TUCASA Nyerere Campus" },
      { name: "description", content: "Search and register TUCASA Nyerere Campus members." },
      { property: "og:title", content: "Members — TUCASA Nyerere Campus" },
      { property: "og:description", content: "Search and register TUCASA Nyerere Campus members." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MembersPage,
});

const input = "w-full rounded-md border bg-background px-3 py-2 text-sm";

function MembersPage() {
  const [list, setList] = useState<Member[]>(seed);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", department: "", year: "1", residency: "", phone: "" });
  const filtered = list.filter((m) =>
    [m.name, m.department, m.residency].join(" ").toLowerCase().includes(q.toLowerCase()),
  );
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.department) return;
    setList([{ id: Math.max(...list.map((m) => m.id)) + 1, ...form, year: Number(form.year) }, ...list]);
    setForm({ name: "", department: "", year: "1", residency: "", phone: "" });
  };
  return (
    <AppShell>
      <PageTitle title="Member Directory" subtitle={`${list.length} registered members`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <WhiteCard className="lg:col-span-1">
          <h2 className="mb-3 font-semibold">Register Member</h2>
          <form onSubmit={submit} className="space-y-3">
            <input className={input} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={input} placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <select className={input} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
              {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
            <input className={input} placeholder="Residency (hall/hostel)" value={form.residency} onChange={(e) => setForm({ ...form, residency: e.target.value })} />
            <input className={input} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <button className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground">Register</button>
          </form>
        </WhiteCard>
        <WhiteCard className="lg:col-span-2">
          <input className={input + " mb-3"} placeholder="Search by name, department, residency…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="space-y-2">
            {filtered.map((m) => (
              <div key={m.id} className="flex flex-col gap-1 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-muted-foreground">{m.department} · Year {m.year}</p>
                </div>
                <div className="text-sm text-muted-foreground sm:text-right">
                  <p>{m.residency}</p>
                  <p className="text-xs">ID {m.id}</p>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground">No members found.</p>}
          </div>
        </WhiteCard>
      </div>
    </AppShell>
  );
}
