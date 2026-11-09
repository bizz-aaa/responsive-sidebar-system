import { useEffect, useState, type RefObject } from "react";
import { ArrowUp, List, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

type Entry = { id: string; title: string };
export function PageContents({ root, pageKey }: { root: RefObject<HTMLDivElement | null>; pageKey: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let frame = 0;
    const updateBlur = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const heading = element.querySelector<HTMLElement>(".page-heading");
        if (!heading) return;
        const pinnedTop = Number.parseFloat(getComputedStyle(heading).top) || 80;
        const distance = Math.max(0, pinnedTop - element.getBoundingClientRect().top);
        const progress = Math.min(1, distance / Math.max(120, heading.offsetHeight * 0.8));
        heading.style.setProperty("--heading-scroll-blur", `${(progress * 8).toFixed(2)}px`);
        heading.style.setProperty("--heading-scroll-opacity", `${(1 - progress * 0.55).toFixed(3)}`);
      });
    };
    const observer = new MutationObserver(updateBlur);
    observer.observe(element, { childList: true, subtree: true });
    window.addEventListener("scroll", updateBlur, { passive: true });
    window.addEventListener("resize", updateBlur);
    updateBlur();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", updateBlur);
      window.removeEventListener("resize", updateBlur);
    };
  }, [root, pageKey]);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        for (const card of element.querySelectorAll<HTMLElement>("[data-scroll-card]")) {
          const parent = card.parentElement;
          const siblings = parent ? Array.from(parent.children).filter((child) => child.hasAttribute("data-scroll-card")) : [];
          const columns = parent ? getComputedStyle(parent).gridTemplateColumns.split(" ").length : 1;
          const singleColumn = !parent || getComputedStyle(parent).display !== "grid" || columns === 1;
          card.toggleAttribute("data-stack", singleColumn && siblings.length > 1 && card.offsetHeight < window.innerHeight - 112);
        }
        const next = Array.from(element.querySelectorAll<HTMLElement>("h2, h3")).map((heading, index) => {
          heading.id = `page-section-${index}`;
          return { id: heading.id, title: heading.textContent?.trim() ?? "" };
        }).filter((entry) => entry.title);
        const isLong = next.length >= 4 || (next.length >= 2 && element.scrollHeight > window.innerHeight * 1.3);
        setEntries((previous) => {
          const result = isLong ? next : [];
          return JSON.stringify(previous) === JSON.stringify(result) ? previous : result;
        });
      });
    };
    const mutation = new MutationObserver(update);
    mutation.observe(element, { childList: true, subtree: true, characterData: true });
    const resize = new ResizeObserver(update);
    resize.observe(element);
    window.addEventListener("resize", update);
    update();
    return () => { cancelAnimationFrame(frame); mutation.disconnect(); resize.disconnect(); window.removeEventListener("resize", update); };
  }, [root, pageKey]);
  if (entries.length === 0) return null;
  const jump = (id?: string) => {
    setOpen(false);
    window.setTimeout(() => {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
      if (id) document.getElementById(id)?.scrollIntoView({ behavior, block: "start" });
      else window.scrollTo({ top: 0, behavior });
    }, 120);
  };
  return <>
    <Button aria-label="Open page contents" title="Page contents" onClick={() => setOpen(true)} className="fixed bottom-5 right-4 z-20 h-11 w-11 rounded-full border border-glass-border bg-ocean-deep text-on-ocean shadow-lg sm:right-6"><List className="h-5 w-5" /></Button>
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="overflow-y-auto border-glass-border bg-ocean-deep text-on-ocean">
        <SheetHeader><SheetTitle className="text-on-ocean">Page contents</SheetTitle><SheetDescription className="sr-only">Sections on this page</SheetDescription></SheetHeader>
        <div className="mt-6 flex flex-col gap-1">
          <Button variant="ghost" className="justify-start text-on-ocean" onClick={() => jump()}><ArrowUp />Top of page</Button>
          {entries.map((entry) => <Button key={entry.id} variant="ghost" className="h-auto min-h-11 justify-between gap-3 py-3 text-left whitespace-normal text-on-ocean" onClick={() => jump(entry.id)}><span className="min-w-0 break-words">{entry.title}</span><ChevronRight className="shrink-0" /></Button>)}
        </div>
      </SheetContent>
    </Sheet>
  </>;
}
