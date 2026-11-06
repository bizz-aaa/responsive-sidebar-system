import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageTitle, WhiteCard } from "@/components/AppShell";
import { events, type CampusEvent } from "@/lib/mock-data";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — TUCASA Nyerere Campus" },
      { name: "description", content: "Fellowships, choir practices and outreach schedules." },
      { property: "og:title", content: "Events — TUCASA Nyerere Campus" },
      { property: "og:description", content: "Fellowships, choir practices and outreach schedules." },
    ],
  }),
  component: EventsPage,
});

const cats = ["All", "Fellowship", "Choir", "Outreach", "Concert"] as const;

function EventsPage() {
  const [cat, setCat] = useState<(typeof cats)[number]>("All");
  const [list, setList] = useState<CampusEvent[]>(events);
  const shown = list.filter((e) => cat === "All" || e.category === cat).sort((a, b) => a.date.localeCompare(b.date));
  return (
    <AppShell>
      <PageTitle title="Events & Fellowship Planner" subtitle="Upcoming fellowships, choir practices and outreach" />
      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border border-glass-border px-3 py-1 text-sm ${cat === c ? "bg-card text-card-foreground" : "bg-glass"}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {shown.map((e) => (
          <WhiteCard key={e.id}>
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{e.category}</span>
            <h3 className="mt-2 font-semibold">{e.title}</h3>
            <p className="text-sm text-muted-foreground">{new Date(e.date).toDateString()} at {e.time}</p>
            <p className="text-xs text-muted-foreground">{e.venue}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{e.registered} registered</span>
              <button
                onClick={() => setList(list.map((x) => (x.id === e.id ? { ...x, registered: x.registered + 1 } : x)))}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
              >
                Register
              </button>
            </div>
          </WhiteCard>
        ))}
      </div>
    </AppShell>
  );
}
