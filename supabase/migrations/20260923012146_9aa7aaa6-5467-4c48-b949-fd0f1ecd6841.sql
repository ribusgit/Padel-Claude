ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER TABLE public.students REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='payments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='students') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
  END IF;
END $$;