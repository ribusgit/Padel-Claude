import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  studentId: z.string().uuid(),
  mediaId: z.string().uuid(),
  /** Fotogramas del vídeo (o la foto) como data URL JPEG, en orden temporal. */
  frames: z.array(z.string().startsWith("data:image/")).min(1).max(8),
  title: z.string().max(120).optional(),
  focus: z.string().max(200).optional(),
});

const levelName = (level: number) => (level <= 2 ? "Iniciación" : level <= 3.5 ? "Intermedio" : "Avanzado");

/**
 * Análisis técnico exhaustivo de un vídeo o foto del alumno con Lovable AI:
 * recibe los fotogramas extraídos en el navegador y devuelve el informe escrito.
 */
export const analyzeTechnique = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: student, error: sErr } = await supabase
      .from("students")
      .select("id, name, level")
      .eq("id", data.studentId)
      .maybeSingle();
    if (sErr) return { ok: false as const, message: sErr.message };
    if (!student) return { ok: false as const, message: "No tienes acceso a este alumno" };

    const { data: media } = await supabase
      .from("media")
      .select("id, title, kind")
      .eq("id", data.mediaId)
      .maybeSingle();

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false as const, message: "Falta la configuración de IA" };

    const runIdFetch = createRunIdFetch();
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    const level = Number(student.level);
    const intro = [
      `Alumno: ${student.name}`,
      `Nivel: ${level.toFixed(1)} (${levelName(level)})`,
      `Archivo: ${data.title || media?.title || "sin título"} (${media?.kind === "foto" ? "foto" : "vídeo"})`,
      data.focus ? `El profesor quiere que te centres en: ${data.focus}` : "",
      data.frames.length > 1
        ? `Te envío ${data.frames.length} fotogramas consecutivos del gesto, en orden temporal.`
        : "Te envío una única imagen del gesto.",
    ]
      .filter(Boolean)
      .join("\n");

    const result = streamText({
      model: lovable.responses("openai/gpt-6-astra"),
      system:
        "Eres analista técnico de pádel de una escuela en España, especialista en biomecánica del golpeo. " +
        "Analizas fotogramas de un golpe y escribes un informe en español, en segunda persona dirigida al alumno, claro y profesional. " +
        "Estructura la respuesta exactamente con estos apartados, cada uno en una línea propia terminada en dos puntos y su contenido debajo: " +
        "GOLPE DETECTADO, POSICIÓN Y PIES, EMPUÑADURA Y PALA, PREPARACIÓN Y ROTACIÓN, IMPACTO, TERMINACIÓN, ERRORES PRINCIPALES, EJERCICIOS PARA CORREGIRLO. " +
        "En ERRORES PRINCIPALES usa como máximo 3 puntos con guiones. En EJERCICIOS usa 3 ejercicios concretos con repeticiones. " +
        "Ajusta las exigencias al nivel del alumno. Si algo no se aprecia en las imágenes, dilo en lugar de inventarlo. No uses markdown ni almohadillas.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text" as const, text: intro },
            ...data.frames.map((frame) => ({ type: "image" as const, image: frame })),
          ],
        },
      ],
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "medium",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    const analysis = (await result.text).trim();
    if (!analysis) {
      return { ok: false as const, message: "La IA no devolvió el análisis. Inténtalo de nuevo." };
    }
    return { ok: true as const, analysis };
  });

function createRunIdFetch() {
  const header = "X-Lovable-AIG-Run-ID";
  let runId: string | undefined;
  return {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(header)) headers.set(header, runId);
      const response = await fetch(input, { ...init, headers });
      const next = response.headers.get(header)?.trim();
      if (!runId && next) runId = next;
      return response;
    },
  };
}
