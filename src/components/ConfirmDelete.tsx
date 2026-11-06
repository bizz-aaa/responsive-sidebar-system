import { useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/** Every delete in the system must pass through this: the user types DELETE and ticks a confirmation. */
export function ConfirmDelete({ what, onConfirm, trigger }: { what: string; onConfirm: () => Promise<unknown> | void; trigger?: ReactNode }) {
  const [text, setText] = useState(""); const [sure, setSure] = useState(false); const [busy, setBusy] = useState(false); const [open, setOpen] = useState(false);
  const ok = text.trim() === "DELETE" && sure;
  return (
    <AlertDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setText(""); setSure(false); } }}>
      <AlertDialogTrigger asChild>
        {trigger ?? <Button size="icon" variant="ghost" aria-label={`Delete ${what}`} className="text-destructive hover:bg-destructive/15"><Trash2 /></Button>}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {what}?</AlertDialogTitle>
          <AlertDialogDescription>This action is permanent and cannot be undone. Type <b>DELETE</b> below to continue.</AlertDialogDescription>
        </AlertDialogHeader>
        <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Type DELETE" className="h-11 w-full rounded-md border bg-background px-3 text-sm" />
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={sure} onChange={(e) => setSure(e.target.checked)} />I understand and confirm I want to delete this.</label>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={!ok || busy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={async (e) => { e.preventDefault(); setBusy(true); try { await onConfirm(); setOpen(false); } finally { setBusy(false); } }}>
            {busy ? "Deleting…" : "Delete permanently"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ExportButtons({ onPdf, onExcel }: { onPdf: () => void; onExcel: () => void }) {
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" className="border-glass-border bg-glass text-on-ocean" onClick={onPdf}>Export PDF</Button>
      <Button size="sm" variant="outline" className="border-glass-border bg-glass text-on-ocean" onClick={onExcel}>Export Excel</Button>
    </div>
  );
}
