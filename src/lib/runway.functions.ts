import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

/**
 * Vídeos reales de los ejercicios generados con Runway (texto → vídeo).
 *
 * Flujo: `startExerciseFilm` crea la tarea en Runway a partir del texto del
 * ejercicio y devuelve su id; el navegador llama a `checkExerciseFilm` cada
 * pocos segundos hasta que el vídeo está listo. Entonces el servidor lo descarga,
 * lo guarda en el bucket privado `session-films` (carpeta `runway/`) y lo asigna a
 * `exercises.film_path`, así que `SessionMedia` lo muestra en lugar del gráfico
 * animado en todas las pantallas.
 *
 * Requiere el secreto `RUNWAYML_API_SECRET` en Lovable (Cloud → Secrets).
 */

const RUNWAY_API = "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";
export const RUNWAY_FOLDER = "runway/";

const startSchema = z.object({ exerciseId: z.string().uuid() });
const checkSchema = z.object({ exerciseId: z.string().uuid(), taskId: z.string().min(1).max(100) });

async function isStaff({ supabase, userId }: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).some((r) => r.role === "admin" || r.role === "coach");
}

function runwayHeaders() {
  const key = process.env["RUNWAYML_API_SECRET"];
  if (!key) return null;
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "X-Runway-Version": RUNWAY_VERSION,
  };
}

const STYLE =
  "Realistic documentary sports footage, filmed on a smartphone gimbal from behind the back glass. " +
  "Outdoor padel court with blue artificial grass, white lines, glass back walls and black metal mesh side fences, central net, daylight. " +
  "Amateur adult players in sportswear with padel rackets (solid perforated paddles, no strings) and yellow balls; a coach guides them. " +
  "Natural movement, real physics, steady camera, no text, no logos, no slow motion.";

/** Convierte el ejercicio (en español) en una descripción visual en inglés para Runway. */
async function buildPrompt(title: string, description: string) {
  const fallback = `${STYLE} Padel drill: ${title}. ${description}`.slice(0, 990);
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return fallback;
  try {
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const { text } = await generateText({
      model: lovable.responses("openai/gpt-6-astra"),
      system:
        "You write prompts for a text-to-video model. Given a padel drill written in Spanish, describe in English, in 2-4 plain sentences " +
        "(max 450 characters), only what the camera sees during 5 seconds: how many players, where they stand on the court, who feeds the ball, " +
        "which stroke they hit (bandeja, volley, lob, serve, wall rebound...) and where the ball travels. Concrete physical actions only, " +
        "no coaching advice, no numbers of repetitions, no text overlays. Return only the description.",
      prompt: `Ejercicio: ${title}\n${description}`,
    });
    const scene = text.trim().replace(/\s+/g, " ");
    return scene ? `${STYLE} ${scene}`.slice(0, 990) : fallback;
  } catch {
    return fallback;
  }
}

export const startExerciseFilm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => startSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isStaff(context))) return { ok: false as const, message: "Solo administración y profesores pueden generar vídeos" };
    const headers = runwayHeaders();
    if (!headers) return { ok: false as const, message: "Falta el secreto RUNWAYML_API_SECRET en Lovable" };

    const { data: ex, error } = await context.supabase
      .from("exercises")
      .select("id, title, description")
      .eq("id", data.exerciseId)
      .maybeSingle();
    if (error || !ex) return { ok: false as const, message: "No se encontró el ejercicio" };

    const promptText = await buildPrompt(ex.title, ex.description ?? "");
    const res = await fetch(`${RUNWAY_API}/text_to_video`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model: "gen4.5", promptText, ratio: "1280:720", duration: 5 }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!res.ok || !body.id) {
      return { ok: false as const, message: `Runway rechazó la petición: ${body.error ?? res.status}` };
    }
    return { ok: true as const, taskId: body.id, promptText };
  });

export const checkExerciseFilm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => checkSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isStaff(context))) return { ok: false as const, message: "Sin permiso" };
    const headers = runwayHeaders();
    if (!headers) return { ok: false as const, message: "Falta el secreto RUNWAYML_API_SECRET en Lovable" };

    const res = await fetch(`${RUNWAY_API}/tasks/${encodeURIComponent(data.taskId)}`, { headers });
    const task = (await res.json().catch(() => ({}))) as { status?: string; output?: string[]; failure?: string; progress?: number };
    if (!res.ok) return { ok: false as const, message: `No se pudo consultar Runway (${res.status})` };

    if (task.status === "FAILED" || task.status === "CANCELLED") {
      return { ok: false as const, message: `Runway no pudo crear el vídeo: ${task.failure ?? task.status}` };
    }
    if (task.status !== "SUCCEEDED") {
      return { ok: true as const, done: false as const, status: task.status ?? "PENDING", progress: task.progress ?? 0 };
    }

    const url = task.output?.[0];
    if (!url) return { ok: false as const, message: "Runway terminó sin devolver el vídeo" };
    const file = await fetch(url);
    if (!file.ok) return { ok: false as const, message: "No se pudo descargar el vídeo de Runway" };
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { data: ex } = await context.supabase.from("exercises").select("film_path").eq("id", data.exerciseId).maybeSingle();
    const path = `${RUNWAY_FOLDER}${data.exerciseId}/${Date.now()}.mp4`;
    const up = await context.supabase.storage.from("session-films").upload(path, bytes, { contentType: "video/mp4" });
    if (up.error) return { ok: false as const, message: `No se pudo guardar el vídeo: ${up.error.message}` };
    const { error } = await context.supabase.from("exercises").update({ film_path: path }).eq("id", data.exerciseId);
    if (error) return { ok: false as const, message: "No se pudo asignar el vídeo al ejercicio" };
    if (ex?.film_path) await context.supabase.storage.from("session-films").remove([ex.film_path]);

    return { ok: true as const, done: true as const, path };
  });
