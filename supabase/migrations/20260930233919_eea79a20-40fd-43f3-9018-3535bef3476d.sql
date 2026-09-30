CREATE TABLE public.court_drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  path text NOT NULL,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.court_drawings TO authenticated;
GRANT ALL ON public.court_drawings TO service_role;
ALTER TABLE public.court_drawings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drawings read members" ON public.court_drawings FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'coach') OR private.has_role(auth.uid(),'alumno'));
CREATE POLICY "drawings write staff" ON public.court_drawings FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'coach'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'coach'));

ALTER TABLE public.classes ADD COLUMN drawing_id uuid REFERENCES public.court_drawings(id) ON DELETE SET NULL;

CREATE POLICY "court drawings read members" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'court-drawings' AND (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'coach') OR private.has_role(auth.uid(),'alumno')));
CREATE POLICY "court drawings upload staff" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'court-drawings' AND (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'coach')));
CREATE POLICY "court drawings delete staff" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'court-drawings' AND (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'coach')));