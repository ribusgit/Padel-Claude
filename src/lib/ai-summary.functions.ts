import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({ studentId: z.string().uuid() });

const LEVELS = (level: number) => (level <= 2 ? "Iniciación" : level <= 3.5 ? "Intermedio" : "Avanzado");

/**
 * Genera un resumen personalizado de la evolución del alumno a partir de sus
 * notas de progreso y su asistencia, usando Lovable AI, y lo guarda.
 */
export const generateProgressSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: student, error: sErr } = await supabase
      .from("students")
      .select("id, name, level, plan, enrolled_at")
      .eq("id", data.studentId)
      .maybeSingle();
    if (sErr) return { ok: false as const, message: sErr.message };
    if (!student) return { ok: false as const, message: "No tienes acceso a este alumno" };

    const [notesRes, attRes] = await Promise.all([
      supabase
        .from("progress_notes")
        .select("date, text")
        .eq("student_id", data.studentId)
        .order("date", { ascending: true }),
      supabase
        .from("attendance")
        .select("date, present")
        .eq("student_id", data.studentId)
        .order("date", { ascending: true }),
    ]);

    const notes = notesRes.data ?? [];
    if (notes.length === 0) {
      return {
        ok: false as const,
        message: "Añade al menos una nota de progreso antes de generar el resumen",
      };
    }
    const attendance = attRes.data ?? [];
    const present = attendance.filter((a) => a.present).length;
    const rate = attendance.length ? Math.round((present / attendance.length) * 100) : null;

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false as const, message: "Falta la configuración de IA" };

    const runIdFetch = createRunIdFetch();
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    const prompt = [
      `Alumno: ${student.name}`,
      `Nivel actual: ${Number(student.level).toFixed(1)} (${LEVELS(Number(student.level))})`,
      `Tarifa: ${student.plan} · Inscrito el ${student.enrolled_at}`,
      rate !== null ? `Asistencia: ${present} de ${attendance.length} clases (${rate}%)` : "Sin asistencias registradas",
      "",
      "Notas de progreso de los profesores (de más antigua a más reciente):",
      ...notes.map((n) => `- ${n.date}: ${n.text}`),
    ].join("\n");

    const result = streamText({
      model: lovable.responses("openai/gpt-6-astra"),
      system:
        "Eres entrenador jefe de una escuela de pádel en España. Escribe en español, en segunda persona dirigida al alumno, con tono cercano y profesional. " +
        "Devuelve un resumen breve (150-220 palabras) de su evolución con tres partes claras: 1) progreso observado, 2) puntos a mejorar, 3) plan de trabajo para las próximas semanas con ejercicios concretos de pádel. " +
        "Usa solo la información aportada, sin inventar datos. No uses markdown ni títulos con almohadillas: usa párrafos cortos.",
      prompt,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    const summary = (await result.text).trim();
    if (!summary) {
      return { ok: false as const, message: "La IA no devolvió un resumen. Inténtalo de nuevo." };
    }

    const { data: row, error: insErr } = await supabase
      .from("progress_summaries")
      .insert({ student_id: data.studentId, summary, generated_by: userId })
      .select("id, summary, created_at")
      .single();
    if (insErr) return { ok: false as const, message: insErr.message };

    return { ok: true as const, summary: row };
  });

function createRunIdFetch() {
  // Import diferido: el módulo servidor no debe entrar en el paquete del navegador.
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
