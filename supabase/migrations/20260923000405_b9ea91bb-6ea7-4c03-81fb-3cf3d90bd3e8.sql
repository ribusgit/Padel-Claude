CREATE TABLE public.progress_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  generated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress_summaries TO authenticated;
GRANT ALL ON public.progress_summaries TO service_role;

ALTER TABLE public.progress_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gestiona resumenes" ON public.progress_summaries
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Profesor ve resumenes de sus alumnos" ON public.progress_summaries
  FOR SELECT TO authenticated
  USING (private.is_my_student(student_id));

CREATE POLICY "Profesor crea resumenes de sus alumnos" ON public.progress_summaries
  FOR INSERT TO authenticated
  WITH CHECK (private.is_my_student(student_id));

CREATE INDEX progress_summaries_student_idx ON public.progress_summaries(student_id, created_at DESC);