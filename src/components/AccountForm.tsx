import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { signupSchema, signinSchema, signinErrorMessage, accountDestination } from "@/lib/registration";
import { registerAccount } from "@/lib/registration.functions";
import { AuthLayout } from "./AuthLayout";
import { useAccount } from "./AccountProvider";
import { getProfile } from "@/lib/registration.functions";
import { useQueryClient } from "@tanstack/react-query";

export const fieldClass = "h-12 w-full rounded-lg border border-glass-border bg-glass px-4 text-sm text-on-ocean outline-none placeholder:text-on-ocean/45 focus:border-ring focus:ring-2 focus:ring-ring/20";
export function AccountForm({ signup = false }: { signup?: boolean }) {
  const navigate = useNavigate(); const register = useServerFn(registerAccount);
  const fetchProfile = useServerFn(getProfile); const queryClient = useQueryClient(); const { user, profile, loading } = useAccount();
  useEffect(() => { if (!loading && user && profile) void navigate({ to: accountDestination(profile.registration_complete), replace: true }); }, [loading, user, profile, navigate]);
  const [form, setForm] = useState({ full_name: "", phone: "", password: "" });
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault(); setError("");
    const result = (signup ? signupSchema : signinSchema).safeParse(form);
    if (!result.success) { setError(result.error.issues[0]?.message ?? "Please check your details."); return; }
    setBusy(true);
    try {
      if (signup) { const registered = await register({ data: signupSchema.parse(form) }); if (registered.error) { setError(registered.error); return; } }
      const credentials = signinSchema.parse(form);
      const { error: loginError } = await supabase.auth.signInWithPassword(credentials);
      if (loginError) { setError(signinErrorMessage(loginError, signup)); return; }
      const { data: identity } = await supabase.auth.getUser();
      const savedProfile = await fetchProfile();
      if (identity.user) queryClient.setQueryData(["profile", identity.user.id], savedProfile);
      await navigate({ to: accountDestination(savedProfile.registration_complete), replace: true });
    } catch { setError("Unable to load your account. Please try again."); } finally { setBusy(false); }
  }
  return <AuthLayout title={signup ? "Create account" : "Sign in"}>
    <form onSubmit={submit} className="space-y-5">
      {signup && <label className="block space-y-2 text-sm font-medium"><span>Full name</span><input required autoComplete="name" maxLength={150} className={fieldClass} placeholder="First and last name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>}
      <label className="block space-y-2 text-sm font-medium"><span>Phone number</span><input required type="tel" autoComplete="tel" maxLength={25} className={fieldClass} placeholder="0712345678" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
      <label className="block space-y-2 text-sm font-medium"><span>Password</span><div className="relative"><input required type={show ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} minLength={8} maxLength={128} className={`${fieldClass} pr-12`} placeholder={signup ? "At least 8 characters" : "Enter password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-2 text-on-ocean/65" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</Button></div></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button disabled={busy} className="h-12 w-full bg-avatar-gradient text-on-ocean" type="submit">{busy ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}{signup ? "Create account" : "Sign in"}</Button>
    </form><p className="mt-6 text-center text-sm text-on-ocean/65">{signup ? "Already have an account?" : "Don't have an account?"} <Link to={signup ? "/auth" : "/sign-up"} className="font-semibold text-on-ocean">{signup ? "Sign in" : "Sign up"}</Link></p>
  </AuthLayout>;
}