import { useState } from "react";
import { Download, ExternalLink, Loader2, ScanEye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { mediaPathOf } from "@/lib/store";
import { signedMediaUrl } from "@/lib/media-storage";
import type { MediaItem } from "@/lib/padel";

/** Enlace que intenta abrir la app instalada en el iPad/iPhone. */
const COACH_VIEW_APP_URL = "coachview://";
/** Alternativa si la app no está instalada. */
const COACH_VIEW_STORE_URL = "https://apps.apple.com/search?term=coach%20view";

/**
 * Descarga el vídeo del alumno al dispositivo y abre Coach View para analizarlo.
 * Coach View es una app externa: no permite recibir el archivo automáticamente,
 * por eso el vídeo se guarda primero en el dispositivo y luego se importa allí.
 */
export function CoachViewButton({ item }: { item: MediaItem }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const download = async () => {
    const path = mediaPathOf(item.id);
    if (!path) {
      toast.error("No se encuentra el archivo del vídeo.");
      return;
    }
    setDownloading(true);
    try {
      const url = await signedMediaUrl(path);
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = item.fileName || `${item.title || "video"}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
      setDownloaded(true);
      toast.success("Vídeo guardado en el dispositivo");
    } catch {
      toast.error("No se pudo descargar el vídeo. Inténtalo de nuevo.");
    } finally {
      setDownloading(false);
    }
  };

  const openCoachView = () => {
    const fallback = window.setTimeout(() => {
      window.open(COACH_VIEW_STORE_URL, "_blank", "noopener");
    }, 1800);
    const cancel = () => window.clearTimeout(fallback);
    window.addEventListener("pagehide", cancel, { once: true });
    window.addEventListener("blur", cancel, { once: true });
    window.location.href = COACH_VIEW_APP_URL;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <ScanEye /> Coach View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Analizar en Coach View</DialogTitle>
          <DialogDescription>
            Guarda el vídeo en el iPad y ábrelo en Coach View para analizar la técnica con detalle.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {item.comment && (
            <div className="max-h-56 overflow-y-auto rounded-xl border border-primary/40 bg-primary/5 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-primary" /> Informe de técnica con IA
              </p>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{item.comment}</p>
            </div>
          )}
          <div className="rounded-xl border border-border bg-secondary/40 p-3">
            <p className="text-sm font-semibold">1. Guardar el vídeo</p>
            <p className="mt-1 text-xs text-muted-foreground">«{item.title || "Sin título"}»</p>
            <Button className="mt-2 w-full" onClick={() => void download()} disabled={downloading}>
              {downloading ? <Loader2 className="animate-spin" /> : <Download />}
              {downloaded ? "Volver a guardar" : "Guardar el vídeo"}
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-secondary/40 p-3">
            <p className="text-sm font-semibold">2. Abrir Coach View</p>
            <p className="mt-1 text-xs text-muted-foreground">
              En Coach View importa el vídeo desde tus archivos o tu galería.
            </p>
            <Button variant="outline" className="mt-2 w-full" onClick={openCoachView}>
              <ExternalLink /> Abrir Coach View
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
