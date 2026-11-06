import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/AuthLayout";
import { fieldClass } from "@/components/AccountForm";
import { completionSchema, pageHead } from "@/lib/registration";
import { completeRegistration, getProfile } from "@/lib/registration.functions";
export const Route = createFileRoute("/_authenticated/complete-registration")({ loader: async () => { const profile = await getProfile(); if (profile.registration_complete) throw redirect({ to: "/" }); return profile; }, head: () => pageHead("Kamilisha usajili", "Kamilisha taarifa zako za masomo na ushirika."), component: CompletionPage });
function CompletionPage() {
  const profile = Route.useLoaderData(); const save = useServerFn(completeRegistration); const navigate = useNavigate();
  const [form, setForm] = useState({ course: "", course_duration: "3", year_of_study: "1", baptized: false, church: "", gender: "" }); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(e: FormEvent) { e.preventDefault(); const result = completionSchema.safeParse(form); if (!result.success) { setError(result.error.issues[0]?.message ?? "Kamilisha taarifa zote."); return; } setBusy(true); setError(""); try { await save({ data: result.data }); await navigate({ to: "/" }); } catch { setError("Taarifa hazijahifadhiwa. Jaribu tena."); } finally { setBusy(false); } }
  return <AuthLayout title="Kamilisha usajili" subtitle={`Karibu, ${profile.full_name}.`}><form onSubmit={submit} className="space-y-4">
    <label className="block space-y-2 text-sm font-medium"><span>Kozi unayosoma</span><input required maxLength={150} className={fieldClass} value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} /></label>
    <div className="grid grid-cols-2 gap-3">{([['course_duration', 'Muda wa kozi (miaka)'], ['year_of_study', 'Mwaka wa masomo']] as const).map(([key, label]) => <label key={key} className="block space-y-2 text-sm font-medium"><span>{label}</span><select className={fieldClass} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>{Array.from({ length: key === 'course_duration' ? 10 : Number(form.course_duration) }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>)}</div>
    <fieldset><legend className="mb-2 text-sm font-medium">Je, umebatizwa?</legend><div className="flex gap-6">{[true, false].map((value) => <label key={String(value)} className="flex items-center gap-2 text-sm"><input type="radio" name="baptized" checked={form.baptized === value} onChange={() => setForm({ ...form, baptized: value })} />{value ? 'Ndiyo' : 'Hapana'}</label>)}</div></fieldset>
    {form.baptized && <label className="block space-y-2 text-sm font-medium"><span>Kanisa lenye ushirika wako</span><input required maxLength={150} className={fieldClass} value={form.church} onChange={(e) => setForm({ ...form, church: e.target.value })} /></label>}
    <fieldset><legend className="mb-2 text-sm font-medium">Jinsia</legend><div className="flex gap-6">{([['female', 'Mwanamke'], ['male', 'Mwanaume']] as const).map(([value, label]) => <label key={value} className="flex items-center gap-2 text-sm"><input required type="radio" name="gender" checked={form.gender === value} onChange={() => setForm({ ...form, gender: value })} />{label}</label>)}</div></fieldset>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={busy} className="h-11 w-full">{busy ? 'Inahifadhi…' : 'Kamilisha usajili'}</Button>
  </form></AuthLayout>;
}