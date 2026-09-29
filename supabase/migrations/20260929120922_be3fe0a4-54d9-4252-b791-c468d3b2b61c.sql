CREATE POLICY "Alumno actualiza su propia ficha"
  ON public.students FOR UPDATE TO authenticated
  USING (id = private.my_student_id())
  WITH CHECK (id = private.my_student_id());