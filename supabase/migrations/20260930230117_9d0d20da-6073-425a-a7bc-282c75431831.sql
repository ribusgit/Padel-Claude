ALTER TABLE public.exercises
ADD COLUMN diagram_type text NOT NULL DEFAULT 'auto'
CHECK (diagram_type IN ('auto', 'rally', 'serve', 'net', 'lob'));