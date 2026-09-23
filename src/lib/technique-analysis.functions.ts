import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  studentId: z.string().uuid(),
  mediaId: z.string().uuid(),
  /** Fotogramas del vídeo (o la foto) en formato data URL JPEG, en orden temporal. */
  frames: z.array(z.string().startsWith("data:image/")).min(1).max(8),
  focus: z.string().max(200).optional(),
});

const levelName = (level: number) => (level <= 2 ? "Iniciación" : level <= 3.5 ? "Intermedio" : "Avanzado");

/**
 * Análisis técnico exhaustivo de un vídeo o foto del alumno con Lovable AI:
 * recibe los fotogramas extraídos en el navegador y devuelve el informe.
 */
export const analyzeTechnique = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const { supabase } = context(arguments as never);
    void supabase;
    return { ok: false as const, message: "" };
  });

function context(_: never): { supabase: unknown } {
  throw new Error("unused");
}
