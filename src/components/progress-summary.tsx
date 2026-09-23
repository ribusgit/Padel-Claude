import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Sparkles, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { generateProgressSummary } from "@/lib/ai-summary.functions";

interface SummaryRow {
  id: string;
  summary: string;
  created_at: string;
}

export function ProgressSummary({ studentId, studentName }: { studentId: string; studentName: string }) {
  const generate = useServerFn(generateProgressSummary);
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("progress_summaries")
      .select("id, summary, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(5);
    setRows(data ?? []);
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async () => {
    setBusy(true);
    try {
      await generate({ data: { studentId } });
      await load();
      toast.success("Resumen de evolución generado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo generar el resumen");
    } finally {
      setBusy(false);
    }
  };

  const latest = rows[0];

  return (
    <div className="rounded-2xl border border-primary/30 bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-display font-semibold">
            <Sparkles className="size-4 text-primary" /> Resumen de evolución con IA
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Combina las notas de los profesores y la asistencia de {studentName.split(" ")[0]}.
          </p>
        </div>
        <Button onClick={() => void run()} disabled={busy} className="shrink-0">
          {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {busy ? "Generando…" : latest ? "Actualizar resumen" : "Generar resumen"}
        </Button>
      </div>

      {latest ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-secondary/50 p-4">
            <p className="whitespace-pre-line text-sm leading-relaxed">{latest.summary}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {format(parseISO(latest.created_at), "d MMM yyyy, HH:mm", { locale: es })}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  void navigator.clipboard.writeText(latest.summary);
                  toast.success("Resumen copiado");
                }}
              >
                <Copy /> Copiar
              </Button>
            </div>
          </div>
          {rows.length > 1 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-xs uppercase tracking-wider text-muted-foreground">
                Resúmenes anteriores ({rows.length - 1})
              </summary>
              <ul className="mt-2 space-y-2">
                {rows.slice(1).map((r) => (
                  <li key={r.id} className="rounded-xl border border-border p-3">
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(r.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{r.summary}</p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Aún no hay resumen. Escribe alguna nota de progreso y pulsa “Generar resumen”.
        </p>
      )}
    </div>
  );
}
