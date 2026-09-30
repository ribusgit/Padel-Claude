import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const DRAWINGS_BUCKET = "court-drawings";

export type CourtDrawing = { id: string; title: string; path: string; url: string };

let cache: Promise<CourtDrawing[]> | null = null;
const listeners = new Set<(items: CourtDrawing[]) => void>();

async function load(): Promise<CourtDrawing[]> {
  const { data, error } = await supabase.from("court_drawings").select("id,title,path").order("created_at", { ascending: false });
  if (error || !data?.length) return [];
  const { data: signed } = await supabase.storage.from(DRAWINGS_BUCKET).createSignedUrls(data.map((d) => d.path), 60 * 60 * 6);
  return data.map((d, i) => ({ ...d, url: signed?.[i]?.signedUrl ?? "" }));
}

export async function refreshDrawings() {
  cache = load();
  const items = await cache;
  listeners.forEach((fn) => fn(items));
  return items;
}

/** Galería compartida de dibujos de pista propios (una sola carga para toda la app). */
export function useDrawings() {
  const [items, setItems] = useState<CourtDrawing[]>([]);
  useEffect(() => {
    listeners.add(setItems);
    (cache ??= load()).then(setItems);
    return () => void listeners.delete(setItems);
  }, []);
  return items;
}

export async function uploadDrawing(file: File, title: string) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from(DRAWINGS_BUCKET).upload(path, file, { contentType: file.type || "image/png" });
  if (error) throw error;
  const { error: insErr } = await supabase.from("court_drawings").insert({ title, path });
  if (insErr) throw insErr;
  await refreshDrawings();
}

export async function renameDrawing(id: string, title: string) {
  const { error } = await supabase.from("court_drawings").update({ title }).eq("id", id);
  if (error) throw error;
  await refreshDrawings();
}

export async function deleteDrawing(d: CourtDrawing) {
  const { error } = await supabase.from("court_drawings").delete().eq("id", d.id);
  if (error) throw error;
  await supabase.storage.from(DRAWINGS_BUCKET).remove([d.path]);
  await refreshDrawings();
}
