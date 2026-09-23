import { useState } from "react";
import { ChevronDown, PenTool } from "lucide-react";
import { toast } from "sonner";
import { CourtWhiteboard } from "@/components/court-whiteboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ClassSession, Student } from "@/lib/padel";

/**
 * Pizarra táctica dentro de la clase del profesor: dibuja sobre la pista o sobre
 * la imagen de la cámara y guarda el dibujo en la ficha de los alumnos elegidos.
 */
export function ClassWhiteboard({ session, students }: { session: ClassSession; students: Student[] }) {
  const { addMedia } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [selected, setSelected] = useState<string[]>(students.map((s) => s.id));

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const save = async (blob: Blob) => {
    if (selected.length === 0) {
      toast.error("Elige al menos un alumno para guardar el dibujo");
      return;
    }
    try {
      for (const id of selected) {
        await addMedia(
          {
            studentId: id,
            kind: "foto",
            title: title.trim() || `Pizarra clase ${session.time}`,
            comment: comment.trim(),
            fileName: `pizarra-clase-${Date.now()}.png`,
            mimeType: "image/png",
            size: blob.size,
          },
          blob,
        );
      }
      toast.success(
        selected.length === 1 ? "Dibujo guardado en la ficha del alumno" : `Dibujo guardado en ${selected.length} fichas`,
      );
      setTitle("");
      setComment("");
    } catch {
      toast.error("No se ha podido guardar el dibujo");
    }
  };

  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-primary"
        aria-expanded={open}
      >
        <PenTool className="size-4" /> Pizarra en la pista
        <ChevronDown className={cn("ml-auto size-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-4 px-4 pb-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`pz-t-${session.id}`}>Título</Label>
              <Input
                id={`pz-t-${session.id}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Colocación en el saque"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`pz-c-${session.id}`}>Comentario / deberes</Label>
              <Textarea
                id={`pz-c-${session.id}`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Ej. Cubre el centro tras la volea."
              />
            </div>
          </div>

          {students.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Guardar en la ficha de</p>
              <div className="flex flex-wrap gap-2">
                {students.map((s) => (
                  <Button
                    key={s.id}
                    type="button"
                    size="sm"
                    variant={selected.includes(s.id) ? "default" : "secondary"}
                    onClick={() => toggle(s.id)}
                    aria-pressed={selected.includes(s.id)}
                  >
                    {s.name.split(" ")[0]}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <CourtWhiteboard onSave={save} saveLabel="Guardar en las fichas" />
        </div>
      )}
    </div>
  );
}
