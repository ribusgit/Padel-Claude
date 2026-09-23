import { useState } from "react";
import { Sparkles, Save, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyzeTechnique } from "@/lib/technique-analysis.functions";
import { mediaPathOf, useStore } from "@/lib/store";
import { signedMediaUrl } from "@/lib/media-storage";
import { framesFromUrl } from "@/lib/technique-frames";
import type { MediaItem, Student } from "@/lib/padel";


/**
 * Análisis técnico exhaustivo del vídeo o la foto con IA: extrae fotogramas en el
 * navegador, los envía al modelo y guarda el informe en la ficha del alumno.
 */
export function TechniqueAnalysis({ item, student }: { item: MediaItem; student: Student }) {
  const { updateMedia, addNote } = useStore();
  const analyze = useServerFn(analyzeTechnique);
  const [focus, setFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const run = async () => {
    const path = mediaPathOf(item.id);
    if (!path) {
      toast.error("No se encuentra el archivo");
      return;
    }
    setLoading(true);
    setAnalysis(null);
    try {
      const url = await signedMediaUrl(path);
      const frames = item.kind === "video" ? await framesFromVideo(url) : await framesFromImage(url);
      const res = await analyze({
        data: {
          studentId: student.id,
          mediaId: item.id,
          frames,
          title: item.title,
          ...(focus.trim() ? { focus: focus.trim() } : {}),
        },
      });
      if (!res.ok) {
        toast.error(res.message || "No se ha podido analizar la técnica");
        return;
      }
      setAnalysis(res.analysis);
      toast.success("Análisis técnico listo");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se ha podido analizar la técnica");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-border bg-secondary/40 p-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-primary" /> Análisis de técnica con IA
      </p>
      <div className="mt-2 space-y-2">
        <Label htmlFor={`focus-${item.id}`} className="text-xs text-muted-foreground">
          ¿En qué quieres que se fije? (opcional)
        </Label>
        <Input
          id={`focus-${item.id}`}
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          maxLength={200}
          className="h-10"
          placeholder="Ej. la bandeja y la posición del codo"
        />
        <Button size="sm" className="h-10 w-full" disabled={loading} onClick={() => void run()}>
          <Wand2 /> {loading ? "Analizando el gesto…" : "Analizar la técnica"}
        </Button>
      </div>

      {analysis && (
        <div className="mt-3 space-y-2">
          <p className="whitespace-pre-wrap rounded-xl border border-border bg-card p-3 text-sm leading-relaxed">
            {analysis}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void updateMedia(item.id, { comment: analysis.slice(0, 2000) }).then(() =>
                  toast.success("Análisis guardado en el archivo"),
                );
              }}
            >
              <Save /> Guardar en el archivo
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void addNote(student.id, {
                  date: new Date().toISOString().slice(0, 10),
                  coachId: "",
                  text: `Análisis de técnica (${item.title}):\n${analysis}`,
                }).then(() => toast.success("Añadido a las notas de progreso"));
              }}
            >
              <Save /> Añadir a notas de progreso
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
