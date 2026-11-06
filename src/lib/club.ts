import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/components/AccountProvider";

export function useIsAdmin() {
  const { user } = useAccount();
  const q = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_admin", { _uid: user!.id });
      if (error) throw error;
      return Boolean(data);
    },
  });
  return { isAdmin: q.data ?? false, loading: q.isPending };
}

export const tzs = (n: number | string) => `TZS ${Number(n).toLocaleString("en-US")}`;
export const genderLabel = (g: string | null) => (g === "female" ? "Female" : g === "male" ? "Male" : "—");
export const readingCategories = [
  { id: "bible_plan", label: "Bible Reading Plan" },
  { id: "lesson", label: "Sabbath School Lesson" },
  { id: "yearbook", label: "Book of the Year" },
] as const;
export const contributionKinds = [
  { id: "membership", label: "Membership fee" },
  { id: "graduation", label: "Graduation" },
  { id: "event", label: "Event" },
  { id: "other", label: "Other" },
] as const;
export const kindLabel = (k: string) => contributionKinds.find((c) => c.id === k)?.label ?? k;
export const inputClass = "h-11 w-full rounded-lg border border-glass-border bg-glass px-3 text-sm text-on-ocean outline-none placeholder:text-on-ocean/45 focus:border-ring focus:ring-2 focus:ring-ring/20 [&>option]:text-foreground";
