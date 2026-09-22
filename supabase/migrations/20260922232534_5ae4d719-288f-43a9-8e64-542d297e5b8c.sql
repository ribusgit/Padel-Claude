CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION private.my_coach_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coach_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION private.is_my_student(_student_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.coach_id = private.my_coach_id() AND _student_id = ANY (c.student_ids)
  )
$$;

-- reemplazar políticas para usar las funciones privadas
DROP POLICY "own profile read" ON public.profiles;
DROP POLICY "own profile write" ON public.profiles;
DROP POLICY "admin inserts profiles" ON public.profiles;
DROP POLICY "own roles read" ON public.user_roles;
DROP POLICY "admin manages roles" ON public.user_roles;
DROP POLICY "coaches read" ON public.coaches;
DROP POLICY "admin manages coaches" ON public.coaches;
DROP POLICY "students read" ON public.students;
DROP POLICY "admin manages students" ON public.students;
DROP POLICY "classes read" ON public.classes;
DROP POLICY "coach updates own class" ON public.classes;
DROP POLICY "admin manages classes" ON public.classes;
DROP POLICY "attendance read" ON public.attendance;
DROP POLICY "attendance write" ON public.attendance;
DROP POLICY "notes read" ON public.progress_notes;
DROP POLICY "notes write" ON public.progress_notes;
DROP POLICY "media read" ON public.media;
DROP POLICY "media write" ON public.media;
DROP POLICY "admin manages payments" ON public.payments;
DROP POLICY "bookings read" ON public.bookings;
DROP POLICY "admin manages bookings" ON public.bookings;

DROP FUNCTION IF EXISTS public.claim_first_admin(TEXT);
DROP FUNCTION IF EXISTS public.admin_exists();
DROP FUNCTION IF EXISTS public.is_my_student(UUID);
DROP FUNCTION IF EXISTS public.my_coach_id();
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role);

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR private.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = auth.uid() OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin inserts profiles" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR private.has_role(auth.uid(), 'admin'));

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manages roles" ON public.user_roles FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "coaches read" ON public.coaches FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manages coaches" ON public.coaches FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "students read" ON public.students FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.is_my_student(id));
CREATE POLICY "admin manages students" ON public.students FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "classes read" ON public.classes FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR coach_id = private.my_coach_id());
CREATE POLICY "coach updates own class" ON public.classes FOR UPDATE TO authenticated
  USING (coach_id = private.my_coach_id()) WITH CHECK (coach_id = private.my_coach_id());
CREATE POLICY "admin manages classes" ON public.classes FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "attendance read" ON public.attendance FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.is_my_student(student_id));
CREATE POLICY "attendance write" ON public.attendance FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.is_my_student(student_id))
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.is_my_student(student_id));

CREATE POLICY "notes read" ON public.progress_notes FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.is_my_student(student_id));
CREATE POLICY "notes write" ON public.progress_notes FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.is_my_student(student_id))
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.is_my_student(student_id));

CREATE POLICY "media read" ON public.media FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.is_my_student(student_id));
CREATE POLICY "media write" ON public.media FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.is_my_student(student_id))
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.is_my_student(student_id));

CREATE POLICY "admin manages payments" ON public.payments FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "bookings read" ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manages bookings" ON public.bookings FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- estado de la escuela: ¿ya hay cuenta de dueño?
CREATE TABLE public.school_state (
  id BOOLEAN NOT NULL PRIMARY KEY DEFAULT true CHECK (id),
  admin_claimed BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO public.school_state (id, admin_claimed) VALUES (true, false);

GRANT SELECT ON public.school_state TO anon, authenticated;
GRANT UPDATE ON public.school_state TO authenticated;
GRANT ALL ON public.school_state TO service_role;
ALTER TABLE public.school_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school state readable" ON public.school_state FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin updates school state" ON public.school_state FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "first user claims admin" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'admin'
    AND NOT EXISTS (SELECT 1 FROM public.school_state s WHERE s.admin_claimed)
  );