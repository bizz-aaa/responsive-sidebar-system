import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AppShell, PageTitle, WhiteCard } from "@/components/AppShell";
import { contributions as seed, members, tzs, type Contribution } from "@/lib/mock-data";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "Finance — TUCASA Nyerere Campus" },
      { name: "description", content: "Track tithes, offerings, contributions and project funds." },
      { property: "og:title", content: "Finance — TUCASA Nyerere Campus" },
      { property: "og:description", content: "Track tithes, offerings, contributions and project funds." },
    ],
  }),
  component: FinancePage,
});

const types: Contribution["type"][] = ["Tithe", "Offering", "Special Project", "Contribution"];
const input = "w-full rounded-md border bg-background px-3 py-2 text-sm";

function FinancePage() {
  const [list, setList] = useState(seed);
  const [form, setForm] = useState({ member: members[0]?.name ?? "", type: "Tithe" as Contribution["type"], amount: "" });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount) return;
    setList([{ id: Date.now(), member: form.member, type: form.type, amount, date: new Date().toISOString().slice(0, 10) }, ...list]);
    setForm({ ...form, amount: "" });
  };
  return (
    <AppShell>
      <PageTitle title="Financial Tracker" subtitle={`Total collected: ${tzs(list.reduce((s, c) => s + c.amount, 0))}`} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {types.map((t) => (
          <WhiteCard key={t} className="text-center">
            <p className="text-sm text-muted-foreground">{t}</p>
            <p className="mt-1 text-lg font-bold">{tzs(list.filter((c) => c.type === t).reduce((s, c) => s + c.amount, 0))}</p>
          </WhiteCard>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <WhiteCard>
          <h2 className="mb-3 font-semibold">Log Contribution</h2>
          <form onSubmit={submit} className="space-y-3">
            <select className={input} value={form.member} onChange={(e) => setForm({ ...form, member: e.target.value })}>
              {members.map((m) => <option key={m.id}>{m.name}</option>)}
            </select>
            <select className={input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Contribution["type"] })}>
              {types.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input className={input} type="number" placeholder="Amount (TZS)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <button className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground">Save</button>
          </form>
        </WhiteCard>
        <WhiteCard className="lg:col-span-2">
          <h2 className="mb-3 font-semibold">Recent Transactions</h2>
          <div className="space-y-2">
            {list.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.member}</p>
                  <p className="text-xs text-muted-foreground">{c.type} · {c.date}</p>
                </div>
                <span className="shrink-0 font-semibold">{tzs(c.amount)}</span>
              </div>
            ))}
          </div>
        </WhiteCard>
      </div>
    </AppShell>
  );
}
