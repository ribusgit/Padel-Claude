CREATE POLICY "Profesor lee todas las clases"
  ON public.classes FOR SELECT TO authenticated
  USING (private.my_coach_id() IS NOT NULL);