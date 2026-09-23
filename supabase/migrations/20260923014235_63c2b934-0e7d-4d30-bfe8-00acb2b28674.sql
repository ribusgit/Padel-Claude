ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'alumno';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION private.my_student_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT student_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE POLICY "Alumno lee su propia ficha"
  ON public.students FOR SELECT TO authenticated
  USING (id = private.my_student_id());

CREATE POLICY "Alumno lee sus propios pagos"
  ON public.payments FOR SELECT TO authenticated
  USING (student_id = private.my_student_id());