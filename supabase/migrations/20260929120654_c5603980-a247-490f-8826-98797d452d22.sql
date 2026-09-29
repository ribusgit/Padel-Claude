CREATE POLICY "alumno lee sus clases" ON public.classes FOR SELECT TO authenticated
  USING (private.my_student_id() = ANY(student_ids));
CREATE POLICY "alumno lee sus profesores" ON public.coaches FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.coach_id = coaches.id AND private.my_student_id() = ANY(c.student_ids)));