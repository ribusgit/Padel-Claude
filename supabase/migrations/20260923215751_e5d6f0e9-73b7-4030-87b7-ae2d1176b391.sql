DROP POLICY IF EXISTS "bookings read" ON public.bookings;
CREATE POLICY "bookings read staff" ON public.bookings FOR SELECT TO authenticated
USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'coach'));

DROP POLICY IF EXISTS "whatsapp log read" ON public.whatsapp_messages;
CREATE POLICY "whatsapp log read own" ON public.whatsapp_messages FOR SELECT TO authenticated
USING (private.has_role(auth.uid(),'admin') OR sent_by = auth.uid());

DROP POLICY IF EXISTS "club settings read" ON public.club_settings;
CREATE POLICY "club settings read members" ON public.club_settings FOR SELECT TO authenticated
USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'coach') OR private.has_role(auth.uid(),'alumno'));

DROP POLICY IF EXISTS "coaches read" ON public.coaches;
CREATE POLICY "coaches read staff" ON public.coaches FOR SELECT TO authenticated
USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'coach'));

DROP POLICY IF EXISTS "school state readable" ON public.school_state;
CREATE POLICY "school state read admin" ON public.school_state FOR SELECT TO authenticated
USING (private.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.is_admin_claimed()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT coalesce((SELECT admin_claimed FROM public.school_state WHERE id = true), false) $$;
REVOKE ALL ON FUNCTION public.is_admin_claimed() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin_claimed() TO anon, authenticated;