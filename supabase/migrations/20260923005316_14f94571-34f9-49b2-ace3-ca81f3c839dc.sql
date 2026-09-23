CREATE TABLE public.whatsapp_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  direction text NOT NULL DEFAULT 'enviado' CHECK (direction IN ('enviado', 'recibido')),
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  recipient_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  sent_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp log read" ON public.whatsapp_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "whatsapp log insert" ON public.whatsapp_messages
  FOR INSERT TO authenticated WITH CHECK (sent_by = auth.uid() OR sent_by IS NULL);

CREATE POLICY "admin manages whatsapp log" ON public.whatsapp_messages
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX whatsapp_messages_created_at_idx ON public.whatsapp_messages (created_at DESC);
