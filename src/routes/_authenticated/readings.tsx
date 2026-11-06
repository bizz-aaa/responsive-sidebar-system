import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { BookOpen, Download } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageTitle, WhiteCard } from "@/components/AppShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { inputClass, readingCategories, useIsAdmin } from "@/lib/club";
import { pageHead } from "@/lib/registration";

export const Route = createFileRoute("/_authenticated/readings")({
  head: () => pageHead("Readings", "Bible reading plan, Sabbath School lessons and the book of the year."),
  component: ReadingsPage,
});

function ReadingsPage() {
  const { isAdmin } = useIsAdmin(); const qc = useQueryClient();
  const [tab, setTab] = useState<string>("bible_plan");
  const [form, setForm] = useState({ title: "", description: "" }); const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ["readings"], queryFn: async () => { const { data, error } = await supabase.from("readings").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });
  const shown = (q.data ?? []).filter((r) => r.category === tab);

  async function upload(e: FormEvent) {
    e.preventDefault(); if (form.title.trim().length < 2) return toast.error("Enter a title.");
    setBusy(true);
    try {
      let file_path: string | null = null;
      if (file) {
        file_path = `${tab}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error } = await supabase.storage.from("readings").upload(file_path, file);
        if (error) throw error;
      }
      const { error } = await supabase.from("readings").insert({ category: tab, title: form.title.trim(), description: form.description.trim() || null, file_path, file_name: file?.name ?? null });
      if (error) throw error;
      setForm({ title: "", description: "" }); setFile(null); toast.success("Reading uploaded."); qc.invalidateQueries({ queryKey: ["readings"] });
    } catch { toast.error("Upload failed."); } finally { setBusy(false); }
  }
  async function open(path: string) { const { data, error } = await supabase.storage.from("readings").createSignedUrl(path, 600); if (error || !data) return toast.error("Could not open file."); window.open(data.signedUrl, "_blank", "noopener"); }
  async function remove(id: string, path: string | null) { if (path) await supabase.storage.from("readings").remove([path]); const { error } = await supabase.from("readings").delete().eq("id", id); if (error) toast.error("Could not delete."); else qc.invalidateQueries({ queryKey: ["readings"] }); }

  return (
    <AppShell>
      <PageTitle title="Readings" subtitle="Study materials shared by leadership" />
      <div className="flex flex-wrap gap-2">
        {readingCategories.map((c) => <Button key={c.id} onClick={() => setTab(c.id)} variant="outline" className={`rounded-full border-glass-border ${tab === c.id ? "bg-card text-card-foreground" : "bg-glass text-on-ocean"}`}>{c.label}</Button>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {isAdmin && (
          <WhiteCard>
            <h2 className="mb-3 font-semibold">Upload to {readingCategories.find((c) => c.id === tab)?.label}</h2>
            <form onSubmit={upload} className="space-y-3">
              <input className={inputClass} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea className={inputClass + " h-24 py-2"} placeholder="Description or reading text (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <input type="file" accept=".pdf,.doc,.docx,.epub,image/*" className="block w-full text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <Button disabled={busy} className="w-full">{busy ? "Uploading…" : "Upload"}</Button>
            </form>
          </WhiteCard>
        )}
        <div className={`space-y-3 ${isAdmin ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {shown.length === 0 && <WhiteCard><p className="text-sm">No readings here yet.</p></WhiteCard>}
          {shown.map((r) => (
            <WhiteCard key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3"><BookOpen className="mt-0.5 h-5 w-5 shrink-0" /><div className="min-w-0"><h3 className="font-semibold">{r.title}</h3>{r.description && <p className="mt-1 whitespace-pre-line text-sm text-on-ocean/80">{r.description}</p>}<p className="mt-1 text-xs text-on-ocean/60">{new Date(r.created_at).toDateString()}</p></div></div>
                <div className="flex shrink-0 items-center gap-1">
                  {r.file_path && <Button size="sm" variant="outline" className="border-glass-border bg-glass text-on-ocean" onClick={() => open(r.file_path!)}><Download />Open</Button>}
                  {isAdmin && <ConfirmDelete what={r.title} onConfirm={() => remove(r.id, r.file_path)} />}
                </div>
              </div>
            </WhiteCard>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
