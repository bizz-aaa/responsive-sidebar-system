import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/lib/registration.functions";
import type { Tables } from "@/integrations/supabase/types";
const AccountContext = createContext<{ user: User | null; profile: Tables<"profiles"> | null }>({ user: null, profile: null });
export const useAccount = () => useContext(AccountContext);
export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const router = useRouter(); const queryClient = useQueryClient(); const fetchProfile = useServerFn(getProfile);
  useEffect(() => {
    let active = true;
    const refresh = () => { void supabase.auth.getUser().then(({ data }) => { if (active) setUser(data.user); }); };
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      if (event === "SIGNED_OUT") setUser(null); else queueMicrotask(refresh);
      void router.invalidate(); if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    refresh(); return () => { active = false; data.subscription.unsubscribe(); };
  }, [router, queryClient]);
  const { data: profile } = useQuery({ queryKey: ["profile", user?.id], queryFn: () => fetchProfile(), enabled: Boolean(user), retry: false });
  return <AccountContext.Provider value={{ user, profile: profile ?? null }}>{children}</AccountContext.Provider>;
}