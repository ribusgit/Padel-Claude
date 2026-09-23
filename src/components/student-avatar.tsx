import { useEffect, useState } from "react";
import { Avatar } from "@/components/padel-ui";
import { signedMediaUrl } from "@/lib/media-storage";

/** Caché de URLs firmadas por ruta para no pedir una nueva en cada render. */
const urlCache = new Map<string, string>();

export function useStudentPhotoUrl(photoPath?: string) {
  const [url, setUrl] = useState<string | null>(photoPath ? (urlCache.get(photoPath) ?? null) : null);

  useEffect(() => {
    let alive = true;
    if (!photoPath) {
      setUrl(null);
      return;
    }
    const cached = urlCache.get(photoPath);
    if (cached) {
      setUrl(cached);
      return;
    }
    signedMediaUrl(photoPath)
      .then((u) => {
        urlCache.set(photoPath, u);
        if (alive) setUrl(u);
      })
      .catch(() => {
        if (alive) setUrl(null);
      });
    return () => {
      alive = false;
    };
  }, [photoPath]);

  return url;
}

export function StudentAvatar({
  name,
  photoPath,
  className,
}: {
  name: string;
  photoPath?: string | undefined;
  className?: string | undefined;
}) {
  const url = useStudentPhotoUrl(photoPath);
  return <Avatar name={name} src={url ?? undefined} className={className} />;
}

/** Reduce la foto a un máximo de 512 px y la convierte a JPEG ligero. */
export async function resizePhoto(file: File, maxSize = 512): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la imagen"))), "image/jpeg", 0.85);
  });
}
