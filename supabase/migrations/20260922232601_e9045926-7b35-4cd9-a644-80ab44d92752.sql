-- Las rutas de archivo son: <student_id>/<archivo>
CREATE POLICY "media files read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'media'
    AND (
      private.has_role(auth.uid(), 'admin')
      OR private.is_my_student(NULLIF((storage.foldername(name))[1], '')::uuid)
    )
  );

CREATE POLICY "media files insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (
      private.has_role(auth.uid(), 'admin')
      OR private.is_my_student(NULLIF((storage.foldername(name))[1], '')::uuid)
    )
  );

CREATE POLICY "media files delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND (
      private.has_role(auth.uid(), 'admin')
      OR private.is_my_student(NULLIF((storage.foldername(name))[1], '')::uuid)
    )
  );