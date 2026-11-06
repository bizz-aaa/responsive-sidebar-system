CREATE TABLE public.system_admins (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_admins TO authenticated;
GRANT ALL ON public.system_admins TO service_role;
ALTER TABLE public.system_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own system admin row" ON public.system_admins FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = _uid)
      OR EXISTS (SELECT 1 FROM public.leaders l JOIN public.leadership_positions p ON p.id = l.position_id WHERE l.user_id = _uid AND p.is_admin)
$$;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM authenticated;