CREATE TABLE public.leadership_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body text NOT NULL CHECK (body IN ('adcom','excom')),
  title text NOT NULL CHECK (length(title) BETWEEN 2 AND 100),
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.leaders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES public.leadership_positions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leader_name text NOT NULL,
  leader_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (position_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leadership_positions, public.leaders TO authenticated;
GRANT ALL ON public.leadership_positions, public.leaders TO service_role;
ALTER TABLE public.leadership_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaders ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.leaders l JOIN public.leadership_positions p ON p.id = l.position_id WHERE l.user_id = _uid AND p.is_admin)
$$;

CREATE POLICY "Read positions" ON public.leadership_positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage positions" ON public.leadership_positions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Read leaders" ON public.leaders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage leaders" ON public.leaders FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.leadership_positions (body, title, is_admin) VALUES
 ('adcom','Chairperson',true),('adcom','Secretary',true),('adcom','Treasurer',true),('adcom','Communications Leader',true),
 ('excom','Choir Leader',false),('excom','Prayer Coordinator',false),('excom','Outreach Coordinator',false);

CREATE OR REPLACE FUNCTION public.claim_first_admin() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pos uuid; pr record;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.leaders l JOIN public.leadership_positions p ON p.id = l.position_id WHERE p.is_admin) THEN RETURN false; END IF;
  SELECT id INTO pos FROM public.leadership_positions WHERE body='adcom' AND is_admin ORDER BY created_at LIMIT 1;
  IF pos IS NULL THEN INSERT INTO public.leadership_positions(body,title,is_admin) VALUES ('adcom','Chairperson',true) RETURNING id INTO pos; END IF;
  SELECT full_name, phone INTO pr FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.leaders(position_id,user_id,leader_name,leader_phone) VALUES (pos, auth.uid(), pr.full_name, pr.phone);
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Family groups
CREATE TABLE public.family_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.family_members (
  group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_leader boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_groups, public.family_members TO authenticated;
GRANT ALL ON public.family_groups, public.family_members TO service_role;
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.my_family_group(_uid uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT group_id FROM public.family_members WHERE user_id = _uid
$$;

CREATE POLICY "Read own family group" ON public.family_groups FOR SELECT TO authenticated USING (id = public.my_family_group(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage family groups" ON public.family_groups FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Read own family members" ON public.family_members FOR SELECT TO authenticated USING (group_id = public.my_family_group(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage family members" ON public.family_members FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Read family mates profiles" ON public.profiles FOR SELECT TO authenticated USING (public.my_family_group(id) IS NOT NULL AND public.my_family_group(id) = public.my_family_group(auth.uid()));

CREATE OR REPLACE FUNCTION public.assign_family_group(_uid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g record; p record; best uuid; best_score int := -1; s int;
BEGIN
  IF EXISTS (SELECT 1 FROM public.family_members WHERE user_id = _uid) THEN RETURN; END IF;
  SELECT gender, year_of_study, registration_complete INTO p FROM public.profiles WHERE id = _uid;
  IF p IS NULL OR NOT p.registration_complete THEN RETURN; END IF;
  FOR g IN
    SELECT fg.id, count(fm.user_id) AS c,
      count(fm.user_id) FILTER (WHERE pr.gender = p.gender) AS same_g,
      count(fm.user_id) FILTER (WHERE pr.year_of_study = p.year_of_study) AS same_y
    FROM public.family_groups fg
    LEFT JOIN public.family_members fm ON fm.group_id = fg.id
    LEFT JOIN public.profiles pr ON pr.id = fm.user_id
    GROUP BY fg.id HAVING count(fm.user_id) < 5
  LOOP
    -- keep groups mixed: at most 3 of one gender and at most 2 from the same year
    IF g.same_g >= 3 OR g.same_y >= 2 THEN CONTINUE; END IF;
    s := (CASE WHEN g.same_g = 0 THEN 3 ELSE 0 END) + (CASE WHEN g.same_y = 0 THEN 3 ELSE 0 END) + g.c::int;
    IF s > best_score THEN best_score := s; best := g.id; END IF;
  END LOOP;
  IF best IS NULL THEN
    INSERT INTO public.family_groups(name) VALUES ('Family ' || ((SELECT count(*) FROM public.family_groups) + 1)) RETURNING id INTO best;
  END IF;
  INSERT INTO public.family_members(group_id, user_id, is_leader)
  VALUES (best, _uid, NOT EXISTS (SELECT 1 FROM public.family_members WHERE group_id = best));
END $$;
REVOKE ALL ON FUNCTION public.assign_family_group(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.assign_unassigned_members() RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; n int := 0;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  FOR r IN SELECT id FROM public.profiles pr WHERE registration_complete AND NOT EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.user_id = pr.id) ORDER BY created_at LOOP
    PERFORM public.assign_family_group(r.id); n := n + 1;
  END LOOP;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.assign_unassigned_members() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_unassigned_members() TO authenticated;

CREATE OR REPLACE FUNCTION public.on_profile_completed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.registration_complete AND NOT COALESCE(OLD.registration_complete, false) THEN PERFORM public.assign_family_group(NEW.id); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profile_completed_assign_family AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.on_profile_completed();

DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE registration_complete ORDER BY created_at LOOP PERFORM public.assign_family_group(r.id); END LOOP;
END $$;

-- Readings
CREATE TABLE public.readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('bible_plan','lesson','yearbook')),
  title text NOT NULL CHECK (length(title) BETWEEN 2 AND 200),
  description text,
  file_path text,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.readings TO authenticated;
GRANT ALL ON public.readings TO service_role;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read readings" ON public.readings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage readings" ON public.readings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(title) BETWEEN 2 AND 200),
  location text NOT NULL,
  starts_at timestamptz NOT NULL,
  contribution_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (contribution_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid,
  full_name text NOT NULL CHECK (length(full_name) BETWEEN 3 AND 150),
  phone text NOT NULL CHECK (length(phone) BETWEEN 7 AND 25),
  residence text NOT NULL CHECK (length(residence) BETWEEN 1 AND 150),
  year_of_study int NOT NULL CHECK (year_of_study BETWEEN 1 AND 10),
  paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, phone)
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events, public.event_registrations TO authenticated;
GRANT INSERT ON public.event_registrations TO anon;
GRANT ALL ON public.events, public.event_registrations TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads events" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Anyone registers for events" ON public.event_registrations FOR INSERT TO anon, authenticated WITH CHECK ((user_id IS NULL OR user_id = auth.uid()) AND paid = false);
CREATE POLICY "Read own or admin registrations" ON public.event_registrations FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Admins update registrations" ON public.event_registrations FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete registrations" ON public.event_registrations FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.event_registration_count(_event uuid) RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.event_registrations WHERE event_id = _event
$$;
GRANT EXECUTE ON FUNCTION public.event_registration_count(uuid) TO anon, authenticated;

-- Finance
CREATE TABLE public.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(title) BETWEEN 2 AND 200),
  kind text NOT NULL DEFAULT 'other' CHECK (kind IN ('membership','graduation','event','other')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  due_date date,
  event_id uuid UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id uuid NOT NULL REFERENCES public.contributions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  reference text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed')),
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contribution_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contributions, public.payments TO authenticated;
GRANT ALL ON public.contributions, public.payments TO service_role;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read contributions" ON public.contributions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage contributions" ON public.contributions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Read own or admin payments" ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Members submit pending payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending' AND confirmed_at IS NULL);
CREATE POLICY "Admins manage payments" ON public.payments FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.sync_event_contribution() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.contribution_amount > 0 THEN
    INSERT INTO public.contributions(title, kind, amount, due_date, event_id)
    VALUES (NEW.title || ' contribution', 'event', NEW.contribution_amount, NEW.starts_at::date, NEW.id)
    ON CONFLICT (event_id) DO UPDATE SET title = EXCLUDED.title, amount = EXCLUDED.amount, due_date = EXCLUDED.due_date;
  ELSE
    DELETE FROM public.contributions WHERE event_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER events_sync_contribution AFTER INSERT OR UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.sync_event_contribution();

-- Reading files storage policies
CREATE POLICY "Members read reading files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'readings');
CREATE POLICY "Admins upload reading files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'readings' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins delete reading files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'readings' AND public.is_admin(auth.uid()));