import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogos } from "@/components/BrandLogos";
import { inputClass } from "@/lib/club";
import { completionSchema, pageHead } from "@/lib/registration";
import { completeRegistration, getProfile } from "@/lib/registration.functions";

export const Route = createFileRoute("/_authenticated/complete-registration")({
  loader: async () => {
    const profile = await getProfile();
    if (profile.registration_complete) throw redirect({ to: "/dashboard" });
    return profile;
  },
  head: () => pageHead("Complete registration", "Complete your academic and church membership details."),
  component: CompletionPage,
});

const pill = (active: boolean) =>
  `flex flex-1 cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
    active ? "border-ring bg-glass ring-2 ring-ring/20" : "border-glass-border bg-glass/40 text-on-ocean/70 hover:bg-glass/60"
  }`;

function CompletionPage() {
  const queryClient = useQueryClient();
  const profile = Route.useLoaderData();
  const save = useServerFn(completeRegistration);
  const navigate = useNavigate();
  const [form, setForm] = useState({ course: "", course_duration: "3", year_of_study: "1", residence: "", baptized: false, church: "", gender: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const result = completionSchema.safeParse(form);
    if (!result.success) { setError(result.error.issues[0]?.message ?? "Please complete all required details."); return; }
    setBusy(true);
    setError("");
    try {
      const updated = await save({ data: result.data });
      queryClient.setQueryData(["profile", updated.id], updated);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await navigate({ to: "/dashboard" });
    } catch {
      setError("Unable to save your details. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-svh bg-ocean-gradient px-4 py-8 text-on-ocean sm:py-12">
      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="flex justify-center"><BrandLogos /></div>
        <section className="overflow-hidden rounded-2xl border border-glass-border bg-glass p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="bg-avatar-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-glass-border shadow-lg">
              <GraduationCap className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] uppercase tracking-widest text-on-ocean/60">Welcome, {profile.full_name}</p>
              <h1 className="text-lg font-extrabold">Complete registration</h1>
              <p className="text-xs text-on-ocean/70">A few details to set up your membership.</p>
            </div>
          </div>
        </section>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-glass-border bg-glass p-5 backdrop-blur-md">
          <label className="block space-y-2 text-sm font-medium">
            <span>Course</span>
            <input required maxLength={150} placeholder="e.g. Computer Science" className={inputClass} value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            {([["course_duration", "Course duration (years)"], ["year_of_study", "Year of study"]] as const).map(([key, label]) => (
              <label key={key} className="block space-y-2 text-sm font-medium">
                <span>{label}</span>
                <select
                  className={inputClass}
                  value={form[key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [key]: e.target.value,
                      ...(key === "course_duration" ? { year_of_study: String(Math.min(Number(form.year_of_study), Number(e.target.value))) } : {}),
                    })
                  }
                >
                  {Array.from({ length: key === "course_duration" ? 5 : Number(form.course_duration) }, (_, i) => (
                    <option key={i} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <label className="block space-y-2 text-sm font-medium">
            <span>Residence</span>
            <input required maxLength={150} placeholder="e.g. Hostel Block A or Mabibo" className={inputClass} value={form.residence} onChange={(e) => setForm({ ...form, residence: e.target.value })} />
          </label>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Are you baptized?</legend>
            <div className="flex gap-2">
              {[true, false].map((value) => (
                <label key={String(value)} className={pill(form.baptized === value)}>
                  <input type="radio" name="baptized" className="sr-only" checked={form.baptized === value} onChange={() => setForm({ ...form, baptized: value })} />
                  {value ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </fieldset>
          {form.baptized && (
            <label className="block space-y-2 text-sm font-medium">
              <span>Membership church</span>
              <input required maxLength={150} placeholder="e.g. Ubungo SDA" className={inputClass} value={form.church} onChange={(e) => setForm({ ...form, church: e.target.value })} />
            </label>
          )}
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Gender</legend>
            <div className="flex gap-2">
              {([["female", "Female"], ["male", "Male"]] as const).map(([value, label]) => (
                <label key={value} className={pill(form.gender === value)}>
                  <input required type="radio" name="gender" className="sr-only" checked={form.gender === value} onChange={() => setForm({ ...form, gender: value })} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy} className="h-12 w-full bg-avatar-gradient text-on-ocean">
            {busy ? <LoaderCircle className="animate-spin" /> : null}
            {busy ? "Saving…" : "Complete registration"}
          </Button>
        </form>
      </div>
    </main>
  );
}
