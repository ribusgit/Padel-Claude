-- ===== roles =====
CREATE TYPE public.app_role AS ENUM ('admin', 'coach');

CREATE TABLE public.coaches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  specialty TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  coach_id UUID REFERENCES public.coaches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.my_coach_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coach_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;

-- La primera cuenta que se registra se convierte en administradora de la escuela.
CREATE OR REPLACE FUNCTION public.claim_first_admin(_full_name TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE claimed BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    claimed := true;
  END IF;
  INSERT INTO public.profiles (id, full_name) VALUES (auth.uid(), COALESCE(NULLIF(_full_name, ''), ''))
    ON CONFLICT (id) DO UPDATE SET full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name);
  RETURN claimed;
END;
$$;

-- ===== business tables =====
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  enrolled_at DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_status TEXT NOT NULL DEFAULT 'pendiente',
  plan TEXT NOT NULL DEFAULT '1x',
  level NUMERIC(2,1) NOT NULL DEFAULT 1.0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 60,
  court INTEGER NOT NULL,
  coach_id UUID REFERENCES public.coaches(id) ON DELETE SET NULL,
  level TEXT NOT NULL,
  student_ids UUID[] NOT NULL DEFAULT '{}',
  attendance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL,
  date DATE NOT NULL,
  present BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (student_id, class_id)
);

CREATE TABLE public.progress_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.coaches(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  amount NUMERIC(8,2) NOT NULL DEFAULT 0,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at DATE,
  UNIQUE (student_id, month)
);

CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  court INTEGER NOT NULL,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'alquiler',
  name TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.coaches(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'video',
  title TEXT NOT NULL DEFAULT '',
  comment TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL DEFAULT '',
  size BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== grants =====
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coaches, public.profiles, public.user_roles,
  public.students, public.classes, public.attendance, public.progress_notes,
  public.payments, public.bookings, public.media TO authenticated;
GRANT ALL ON public.coaches, public.profiles, public.user_roles, public.students, public.classes,
  public.attendance, public.progress_notes, public.payments, public.bookings, public.media TO service_role;

-- ===== RLS =====
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- helper predicate: is this student in one of my classes?
CREATE OR REPLACE FUNCTION public.is_my_student(_student_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.coach_id = public.my_coach_id() AND _student_id = ANY (c.student_ids)
  )
$$;

-- profiles
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin inserts profiles" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manages roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- coaches: everyone signed in can read (names shown in classes); only admin writes
CREATE POLICY "coaches read" ON public.coaches FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manages coaches" ON public.coaches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- students
CREATE POLICY "students read" ON public.students FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_my_student(id));
CREATE POLICY "admin manages students" ON public.students FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- classes
CREATE POLICY "classes read" ON public.classes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR coach_id = public.my_coach_id());
CREATE POLICY "coach updates own class" ON public.classes FOR UPDATE TO authenticated
  USING (coach_id = public.my_coach_id()) WITH CHECK (coach_id = public.my_coach_id());
CREATE POLICY "admin manages classes" ON public.classes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- attendance
CREATE POLICY "attendance read" ON public.attendance FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_my_student(student_id));
CREATE POLICY "attendance write" ON public.attendance FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_my_student(student_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_my_student(student_id));

-- progress notes
CREATE POLICY "notes read" ON public.progress_notes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_my_student(student_id));
CREATE POLICY "notes write" ON public.progress_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_my_student(student_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_my_student(student_id));

-- media
CREATE POLICY "media read" ON public.media FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_my_student(student_id));
CREATE POLICY "media write" ON public.media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_my_student(student_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_my_student(student_id));

-- payments: admin only
CREATE POLICY "admin manages payments" ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- bookings: everyone signed in reads, admin writes
CREATE POLICY "bookings read" ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manages bookings" ON public.bookings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== demo data =====
INSERT INTO public.coaches (id, name, phone, email, specialty) VALUES
  ('00000000-0000-4000-8000-0000000000c1', 'Carlos Mendoza', '600 111 222', 'carlos@escuelapadel.es', 'Técnica y competición'),
  ('00000000-0000-4000-8000-0000000000c2', 'Laura Gil', '600 333 444', 'laura@escuelapadel.es', 'Iniciación e infantil');

INSERT INTO public.students (id, name, phone, email, enrolled_at, payment_status, plan, level) VALUES
  ('00000000-0000-4000-8000-000000000051', 'Marta Sánchez', '611 223 344', 'marta@gmail.com', CURRENT_DATE - 120, 'pagado', '2x', 3.0),
  ('00000000-0000-4000-8000-000000000052', 'Javier Ruiz', '622 334 455', 'javi.ruiz@hotmail.com', CURRENT_DATE - 45, 'pendiente', '1x', 1.5),
  ('00000000-0000-4000-8000-000000000053', 'Elena Torres', '633 445 566', 'elena.torres@gmail.com', CURRENT_DATE - 300, 'pagado', 'particular', 4.5),
  ('00000000-0000-4000-8000-000000000054', 'Pablo Navarro', '644 556 677', 'pablo.nav@gmail.com', CURRENT_DATE - 20, 'pendiente', '2x', 2.5),
  ('00000000-0000-4000-8000-000000000055', 'Lucía Fernández', '655 667 788', 'lucia.fdez@gmail.com', CURRENT_DATE - 200, 'pagado', '1x', 4.0),
  ('00000000-0000-4000-8000-000000000056', 'Diego Alonso', '666 778 899', 'diego.alonso@gmail.com', CURRENT_DATE - 60, 'pagado', '2x', 3.5);

INSERT INTO public.classes (id, date, time, duration_min, court, coach_id, level, student_ids) VALUES
  ('00000000-0000-4000-8000-000000000071', CURRENT_DATE, '10:00', 60, 1, '00000000-0000-4000-8000-0000000000c2', 'iniciacion', ARRAY['00000000-0000-4000-8000-000000000052']::uuid[]),
  ('00000000-0000-4000-8000-000000000072', CURRENT_DATE, '18:00', 60, 2, '00000000-0000-4000-8000-0000000000c1', 'intermedio', ARRAY['00000000-0000-4000-8000-000000000051','00000000-0000-4000-8000-000000000054','00000000-0000-4000-8000-000000000056']::uuid[]),
  ('00000000-0000-4000-8000-000000000073', CURRENT_DATE, '19:30', 90, 3, '00000000-0000-4000-8000-0000000000c1', 'avanzado', ARRAY['00000000-0000-4000-8000-000000000053','00000000-0000-4000-8000-000000000055']::uuid[]),
  ('00000000-0000-4000-8000-000000000074', CURRENT_DATE + 1, '17:00', 60, 1, '00000000-0000-4000-8000-0000000000c2', 'iniciacion', ARRAY['00000000-0000-4000-8000-000000000052','00000000-0000-4000-8000-000000000054']::uuid[]),
  ('00000000-0000-4000-8000-000000000075', CURRENT_DATE + 2, '18:00', 60, 2, '00000000-0000-4000-8000-0000000000c1', 'intermedio', ARRAY['00000000-0000-4000-8000-000000000051','00000000-0000-4000-8000-000000000056']::uuid[]),
  ('00000000-0000-4000-8000-000000000076', CURRENT_DATE + 3, '20:00', 60, 4, '00000000-0000-4000-8000-0000000000c1', 'avanzado', ARRAY['00000000-0000-4000-8000-000000000053','00000000-0000-4000-8000-000000000055']::uuid[]);

INSERT INTO public.attendance (student_id, class_id, date, present) VALUES
  ('00000000-0000-4000-8000-000000000051', 'hist1', CURRENT_DATE - 7, true),
  ('00000000-0000-4000-8000-000000000051', 'hist2', CURRENT_DATE - 4, true),
  ('00000000-0000-4000-8000-000000000051', 'hist3', CURRENT_DATE - 2, false),
  ('00000000-0000-4000-8000-000000000052', 'hist4', CURRENT_DATE - 7, true),
  ('00000000-0000-4000-8000-000000000052', 'hist5', CURRENT_DATE - 14, true),
  ('00000000-0000-4000-8000-000000000053', 'hist6', CURRENT_DATE - 3, true),
  ('00000000-0000-4000-8000-000000000053', 'hist7', CURRENT_DATE - 6, true),
  ('00000000-0000-4000-8000-000000000054', 'hist8', CURRENT_DATE - 5, true),
  ('00000000-0000-4000-8000-000000000055', 'hist9', CURRENT_DATE - 7, true),
  ('00000000-0000-4000-8000-000000000056', 'hist10', CURRENT_DATE - 3, true);

INSERT INTO public.progress_notes (student_id, coach_id, date, text) VALUES
  ('00000000-0000-4000-8000-000000000051', '00000000-0000-4000-8000-0000000000c1', CURRENT_DATE - 7, 'Buen progreso en la volea de revés. Trabajar la bandeja.'),
  ('00000000-0000-4000-8000-000000000052', '00000000-0000-4000-8000-0000000000c2', CURRENT_DATE - 7, 'Empieza a controlar el saque. Insistir en la posición de espera.'),
  ('00000000-0000-4000-8000-000000000053', '00000000-0000-4000-8000-0000000000c1', CURRENT_DATE - 3, 'Preparación para torneo: remate por 3 muy sólido. Mejorar salida de pared lateral.'),
  ('00000000-0000-4000-8000-000000000055', '00000000-0000-4000-8000-0000000000c1', CURRENT_DATE - 14, 'Buena lectura de juego. Trabajar víbora.');

INSERT INTO public.payments (student_id, month, amount, paid, paid_at)
SELECT s.id, to_char(CURRENT_DATE, 'YYYY-MM'),
  CASE s.plan WHEN '1x' THEN 55 WHEN '2x' THEN 95 ELSE 140 END,
  s.payment_status = 'pagado',
  CASE WHEN s.payment_status = 'pagado' THEN CURRENT_DATE - 3 ELSE NULL END
FROM public.students s;

INSERT INTO public.bookings (court, date, start_time, end_time, type, name, phone, notes) VALUES
  (4, CURRENT_DATE, '11:00', '12:30', 'alquiler', 'Grupo de Sergio Ramos', '677 123 456', NULL),
  (3, CURRENT_DATE, '17:00', '18:00', 'clase', 'Clase de tecnificación', NULL, 'Bloqueada para grupo de competición'),
  (2, CURRENT_DATE + 1, '20:00', '21:30', 'alquiler', 'Ana y Miguel', '688 987 654', NULL);