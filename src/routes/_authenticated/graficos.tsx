import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteDrawing, renameDrawing, uploadDrawing, useDrawings } from "@/lib/drawings";

export const Route = createFileRoute("/_authenticated/graficos")({
  head: () => ({
    meta: [
      { title: "Galería de gráficos de pista — Padel Time" },
      { name: "description", content: "Sube tus propios dibujos de pista y úsalos en cada sesión." },
      { property: "og:title", content: "Galería de gráficos de pista — Padel Time" },
      { property: "og:description", content: "Sube tus propios dibujos de pista y úsalos en cada sesión." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GraficosPage,
});

function GraficosPage() {
  const drawings = useDrawings();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function onUpload() {
    if (!file) {
      toast.error("Elige una imagen");
      return;
    }
    setBusy(true);
    try {
      await uploadDrawing(file, title.trim() || file.name.replace(/\.[^.]+$/, ""));
      setTitle("");
      setFile(null);
      toast.success("Dibujo añadido a la galería");
    } catch {
      toast.error("No se pudo subir el dibujo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Gráficos de pista" subtitle="Sube tus dibujos (foto o captura) y elígelos al crear o editar una clase." />
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <Input placeholder="Nombre del dibujo (p. ej. Salida de red en paralelo)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button onClick={onUpload} disabled={busy || !file} className="w-full sm:w-auto">
          <ImagePlus className="size-4" /> {busy ? "Subiendo…" : "Subir dibujo"}
        </Button>
      </div>
      {drawings.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay dibujos en la galería.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {drawings.map((d) => (
            <div key={d.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <img src={d.url} alt={d.title} className="aspect-[4/3] w-full bg-secondary object-contain" />
              <div className="flex items-center gap-2 p-3">
                <Input
                  defaultValue={d.title}
                  onBlur={(e) => e.target.value.trim() && e.target.value !== d.title && renameDrawing(d.id, e.target.value.trim()).then(() => toast.success("Nombre guardado"))}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Borrar dibujo"
                  onClick={() => confirm("¿Borrar este dibujo? Las clases que lo usan volverán al gráfico automático.") && deleteDrawing(d).then(() => toast.success("Dibujo borrado"))}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
