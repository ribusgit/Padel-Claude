import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, Upload, FlipHorizontal2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Diálogo para tomar una foto con la cámara del dispositivo.
 * Usa la cámara trasera por defecto (ideal en móvil/tablet) y permite cambiar a la frontal.
 */
export function CameraCaptureDialog({
  open,
  onOpenChange,
  onCapture,
  title = "Hacer foto",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void | Promise<void>;
  title?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      return;
    }
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        stopStream();
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
          setReady(true);
        }
      } catch {
        if (!cancelled) setError("No se pudo acceder a la cámara. Revisa los permisos del navegador.");
      }
    })();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, facing, stopStream]);

  const capture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      // Espejo solo en la cámara frontal para que la foto salga natural
      if (facing === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("blob");
      const file = new File([blob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" });
      await onCapture(file);
      onOpenChange(false);
    } catch {
      toast.error("No se pudo capturar la foto");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-border bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`aspect-square w-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`}
            />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                Activando cámara…
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}>
            <FlipHorizontal2 className="size-4" />
            {facing === "environment" ? "Frontal" : "Trasera"}
          </Button>
          <Button type="button" onClick={() => void capture()} disabled={!ready || busy || !!error}>
            <Camera className="size-4" />
            {busy ? "Guardando…" : "Capturar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Botones de elección: subir desde archivos o hacer una foto con la cámara. */
export function PhotoSourceDialog({
  open,
  onOpenChange,
  onPickFile,
  onPickCamera,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPickFile: () => void;
  onPickCamera: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Foto del alumno</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Button type="button" variant="outline" className="justify-start" onClick={onPickCamera}>
            <Camera className="size-4" />
            Hacer foto con la cámara
          </Button>
          <Button type="button" variant="outline" className="justify-start" onClick={onPickFile}>
            <Upload className="size-4" />
            Subir desde archivos
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          <RefreshCw className="mr-1 inline size-3" />
          La foto se recorta y optimiza automáticamente.
        </p>
      </DialogContent>
    </Dialog>
  );
}
