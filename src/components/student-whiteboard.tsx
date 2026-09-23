import { useState } from "react";
import { toast } from "sonner";
import type { Student } from "@/lib/padel";
import { useStore } from "@/lib/store";
import { CourtWhiteboard } from "@/components/court-whiteboard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Pizarra dentro de la ficha del alumno: el dibujo se guarda en su multimedia con el comentario técnico. */
export function StudentWhiteboard({ student }: { student: Student }) {
  const { addMedia } = useStore();
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const save = async (blob: Blob) => {
    const name = `pizarra-${Date.now()}.png`;
    try {
      await addMedia(
        {
          studentId: student.id,
          kind: "foto",
          title: title.trim() || "Pizarra táctica",
          comment: comment.trim(),
          fileName: name,
          mimeType: "image/png",
          size: blob.size,
        },
        blob,
      );
      toast.success("Dibujo guardado en Análisis Multimedia");
      setTitle("");
      setComment("");
    } catch {
      toast.error("No se ha podido guardar el dibujo");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pizarra-titulo">Título</Label>
          <Input
            id="pizarra-titulo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Posición en la bandeja"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pizarra-comentario">Comentario técnico / deberes</Label>
          <Textarea
            id="pizarra-comentario"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Ej. Sube a la red tras el saque y cubre el centro."
          />
        </div>
      </div>

      <CourtWhiteboard onSave={save} saveLabel="Guardar en la ficha" />

      <p className="text-xs text-muted-foreground">
        Los dibujos guardados aparecen en la pestaña «Análisis Multimedia» del alumno.
      </p>
    </div>
  );
}
