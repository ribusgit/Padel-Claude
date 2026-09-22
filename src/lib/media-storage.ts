import { supabase } from "@/integrations/supabase/client";

export const MEDIA_BUCKET = "media";

/** Sube el archivo al almacenamiento privado y devuelve su ruta. */
export async function uploadMediaFile(studentId: string, file: Blob, fileName: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${studentId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    contentType: (file as File).type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function removeMediaFile(path: string) {
  await supabase.storage.from(MEDIA_BUCKET).remove([path]);
}

/** URL temporal firmada para ver la foto o el vídeo. */
export async function signedMediaUrl(path: string, expiresIn = 60 * 60) {
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
