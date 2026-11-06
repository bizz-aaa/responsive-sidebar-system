import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { EventRegistrationForm } from "@/components/EventRegistrationForm";
import { supabase } from "@/integrations/supabase/client";
import { tzs } from "@/lib/club";
import { pageHead } from "@/lib/registration";

export const Route = createFileRoute("/register/$eventId")({
  head: () => pageHead("Event registration", "Register for a TUCASA Nyerere Campus event — no account needed."),
  component: PublicRegister,
});

function PublicRegister() {
  const { eventId } = Route.useParams(); const [done, setDone] = useState(false);
  const q = useQuery({ queryKey: ["public-event", eventId], queryFn: async () => { const { data, error } = await supabase.from("events").select("*").eq("id", eventId).maybeSingle(); if (error) throw error; return data; } });
  const ev = q.data;
  if (q.isPending) return <AuthLayout title="Loading event…"><p /></AuthLayout>;
  if (!ev) return <AuthLayout title="Event not found"><p className="text-sm">This registration link is not valid.</p></AuthLayout>;
  return (
    <AuthLayout title={ev.title} subtitle={`${new Date(ev.starts_at).toLocaleString()} · ${ev.location}${Number(ev.contribution_amount) > 0 ? ` · Contribution ${tzs(ev.contribution_amount)}` : ""}`}>
      {done ? <div className="space-y-2 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-chart-2" /><p className="font-semibold">You are registered!</p></div>
        : <EventRegistrationForm eventId={ev.id} onDone={() => setDone(true)} />}
    </AuthLayout>
  );
}
