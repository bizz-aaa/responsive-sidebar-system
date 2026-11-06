import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { inputClass } from "@/lib/club";
import { phoneSchema } from "@/lib/registration";

export const eventRegistrationSchema = z.object({
  full_name: z.string().trim().min(3, "Enter your full name.").max(150),
  phone: phoneSchema,
  residence: z.string().trim().min(1, "Enter where you stay.").max(150),
  year_of_study: z.coerce.number().int().min(1).max(10),
});

export function EventRegistrationForm({ eventId, userId, defaults, onDone }: { eventId: string; userId?: string | null; defaults?: Partial<Record<"full_name" | "phone" | "residence" | "year_of_study", string>>; onDone: () => void }) {
  const [form, setForm] = useState({ full_name: "", phone: "", residence: "", year_of_study: "1", ...defaults });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); const r = eventRegistrationSchema.safeParse(form);
    if (!r.success) return setError(r.error.issues[0]?.message ?? "Check your details.");
    setBusy(true); setError("");
    const { error } = await supabase.from("event_registrations").insert({ ...r.data, event_id: eventId, user_id: userId ?? null });
    setBusy(false);
    if (error) return setError(error.code === "23505" ? "This phone number is already registered for this event." : "Registration failed. Please try again.");
    onDone();
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={inputClass} placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      <input className={inputClass} placeholder="Phone number" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input className={inputClass} placeholder="Where you stay (hall / hostel)" value={form.residence} onChange={(e) => setForm({ ...form, residence: e.target.value })} />
      <select className={inputClass} value={form.year_of_study} onChange={(e) => setForm({ ...form, year_of_study: e.target.value })}>
        {[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y}>Year {y}</option>)}
      </select>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button disabled={busy} className="w-full">{busy ? "Registering…" : "Register"}</Button>
    </form>
  );
}
