import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { signupSchema, signinSchema } from "@/lib/registration";
import { registerAccount } from "@/lib/registration.functions";
import { AuthLayout } from "./AuthLayout";

export const fieldClass = "h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-card-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20";
export function AccountForm({ signup = false }: { signup?: boolean }) {
  const navigate = useNavigate(); const register = useServerFn(registerAccount);
  const [form, setForm] = useState({ full_name: "", phone: "", password: "" });
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault(); setError("");
    const result = (signup ? signupSchema : signinSchema).safeParse(form);
    if (!result.success) { setError(result.error.issues[0]?.message ?? "Kagua taarifa zako."); return; }
    setBusy(true);
    try {
      if (signup) { const registered = await register({ data: signupSchema.parse(form) }); if (registered.error) { setError(registered.error); return; } }
      const credentials = signinSchema.parse(form);
      const { error: loginError } = await supabase.auth.signInWithPassword(credentials);
      if (loginError) { setError(signup ? "Akaunti imeundwa, lakini kuingia kumeshindikana. Jaribu ukurasa wa Ingia." : "Namba ya simu au password si sahihi."); return; }
      await navigate({ to: "/complete-registration" });
    } catch { setError("Imeshindikana kuunganisha. Jaribu tena."); } finally { setBusy(false); }
  }
  return <AuthLayout title={signup ? "Jisajili" : "Karibu tena"} subtitle={signup ? "Jiunge na familia ya TUCASA Nyerere Campus." : "Ingia kwenye akaunti yako ya TUCASA."}>
    <form onSubmit={submit} className="space-y-5">
      {signup && <label className="block space-y-2 text-sm font-medium"><span>Majina kamili</span><input required autoComplete="name" maxLength={150} className={fieldClass} placeholder="Majina angalau mawili" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>}
      <label className="block space-y-2 text-sm font-medium"><span>Namba ya simu</span><input required type="tel" autoComplete="tel" maxLength={25} className={fieldClass} placeholder="0712345678" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
      <label className="block space-y-2 text-sm font-medium"><span>Password</span><div className="relative"><input required type={show ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} minLength={8} maxLength={128} className={`${fieldClass} pr-12`} placeholder={signup ? "Herufi angalau 8" : "Password yako"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 text-muted-foreground" aria-label={show ? "Ficha password" : "Onyesha password"} onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</Button></div></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button disabled={busy} className="h-11 w-full" type="submit">{busy ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}{signup ? "Tengeneza akaunti" : "Ingia"}</Button>
    </form><p className="mt-6 text-center text-sm text-muted-foreground">{signup ? "Una akaunti tayari?" : "Huna akaunti?"} <Link to={signup ? "/auth" : "/sign-up"} className="font-semibold text-primary">{signup ? "Ingia" : "Jisajili"}</Link></p>
  </AuthLayout>;
}