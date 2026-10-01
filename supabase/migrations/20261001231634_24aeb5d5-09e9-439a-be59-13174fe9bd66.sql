ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS film_path text;
CREATE POLICY "session films read members" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'session-films' AND (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'coach') OR private.has_role(auth.uid(),'alumno')));
CREATE POLICY "session films upload staff" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'session-films' AND (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'coach')));
CREATE POLICY "session films delete staff" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'session-films' AND (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'coach')));