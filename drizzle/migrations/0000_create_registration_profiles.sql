CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 full_name text NOT NULL CHECK (length(full_name) BETWEEN 3 AND 150 AND full_name ~ '\S+\s+\S+'),
 phone text NOT NULL UNIQUE CHECK (phone ~ '^\+[1-9][0-9]{7,14}$'),
 course text,
 course_duration integer CHECK (course_duration BETWEEN 1 AND 10),
 year_of_study integer CHECK (year_of_study BETWEEN 1 AND 10),
 baptized boolean,
 church text,
 gender text CHECK (gender IN ('female','male')),
 registration_complete boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (NOT registration_complete OR (length(trim(course)) > 0 AND course_duration IS NOT NULL AND year_of_study IS NOT NULL AND year_of_study <= course_duration AND baptized IS NOT NULL AND gender IS NOT NULL AND (NOT baptized OR length(trim(church)) > 0)))
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE FUNCTION public.create_registration_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 INSERT INTO public.profiles (id, full_name, phone) VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', '+' || ltrim(NEW.phone, '+'));
 RETURN NEW;
END;
$$;
CREATE TRIGGER create_registration_profile AFTER INSERT ON auth.users FOR EACH ROW WHEN (NEW.phone IS NOT NULL AND NEW.raw_user_meta_data->>'full_name' IS NOT NULL) EXECUTE FUNCTION public.create_registration_profile();