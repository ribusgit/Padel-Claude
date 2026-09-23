CREATE TABLE public.club_hours (
  weekday smallint NOT NULL PRIMARY KEY CHECK (weekday BETWEEN 0 AND 6),
  open_time text NOT NULL DEFAULT '09:00',
  close_time text NOT NULL DEFAULT '22:00',
  closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_hours TO authenticated;
GRANT ALL ON public.club_hours TO service_role;

ALTER TABLE public.club_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club hours read" ON public.club_hours
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin manages club hours" ON public.club_hours
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_club_hours_updated_at
  BEFORE UPDATE ON public.club_hours
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.club_hours (weekday, open_time, close_time, closed) VALUES
  (1, '09:00', '22:00', false),
  (2, '09:00', '22:00', false),
  (3, '09:00', '22:00', false),
  (4, '09:00', '22:00', false),
  (5, '09:00', '22:00', false),
  (6, '09:00', '21:00', false),
  (0, '09:00', '14:00', false);
