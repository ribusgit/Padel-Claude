import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Camera, FileVideo, ImagePlus, Pencil, Save, Sparkles, Trash2, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/padel-ui";
import { WhatsAppButton, mediaReminder } from "@/components/whatsapp-dialog";
import { TechniqueAnalysis } from "@/components/technique-analysis";
import { CoachViewButton } from "@/components/coach-view-button";
import { Switch } from "@/components/ui/switch";
import { mediaPathOf } from "@/lib/store";
import { signedMediaUrl } from "@/lib/media-storage";
import { framesFromFile } from "@/lib/technique-frames";
import { analyzeTechnique } from "@/lib/technique-analysis.functions";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { TECHNIQUE_REPORT_MARK, type MediaItem, type Student } from "@/lib/padel";

const MAX_SIZE = 80 * 1024 * 1024; // 80 MB por archivo

function MediaPreview({ item }: { item: MediaItem }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const path = mediaPathOf(item.id);
    if (!path) return;
    void signedMediaUrl(path)
      .then((signed) => {
        if (!cancelled) setUrl(signed);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [item.id]);

  if (!url) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-secondary text-muted-foreground">
        {item.kind === "video" ? <FileVideo className="size-6" /> : <ImagePlus className="size-6" />}
      </div>
    );
  }

  return item.kind === "video" ? (
    <video src={url} controls playsInline className="aspect-video w-full rounded-xl bg-black object-contain" />
  ) : (
    <img src={url} alt={item.title} className="aspect-video w-full rounded-xl bg-black object-contain" />
  );
}

function MediaCard({ item, student }: { item: MediaItem; student: Student }) {
  const { updateMedia, deleteMedia } = useStore();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [comment, setComment] = useState(item.comment);

  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-card">
      <MediaPreview item={item} />
      <div className="p-3">
        {editing ? (
          <div className="space-y-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10" maxLength={80} placeholder="Título" />
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-20"
              maxLength={400}
              placeholder="Comentarios técnicos o deberes"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  void updateMedia(item.id, { title: title.trim() || "Sin título", comment: comment.trim() });
                  setEditing(false);
                  toast.success("Análisis actualizado");
                }}
              >
                <Save /> Guardar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2">
              <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary")}>
                {item.kind === "video" ? <Video className="size-3.5" /> : <ImagePlus className="size-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">{item.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {format(parseISO(item.createdAt), "d MMM yyyy · HH:mm", { locale: es })} ·{" "}
                  {(item.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>
            {item.comment && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.comment}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                <Pencil /> Editar
              </Button>
              <WhatsAppButton
                message={{
                  to: student.name,
                  phone: student.phone,
                  kind: "Nuevo análisis de técnica",
                  body: mediaReminder(student.name, item.title, item.comment),
                }}
                label="Notificar"
              />
              {item.kind === "video" && <CoachViewButton item={item} />}
              <Button
                size="icon"
                variant="ghost"
                aria-label="Eliminar archivo"
                className="ml-auto text-muted-foreground hover:text-destructive"
                onClick={() => {
                  void deleteMedia(item.id);
                  toast.success("Archivo eliminado");
                }}
              >
                <Trash2 />
              </Button>
            </div>
            <TechniqueAnalysis item={item} student={student} />
          </>
        )}
      </div>
    </li>
  );
}

export function StudentMedia({ student }: { student: Student }) {
  const { data, addMedia, updateMedia } = useStore();
  const analyze = useServerFn(analyzeTechnique);
  const items = data.media.filter((m) => m.studentId === student.id);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [pending, setPending] = useState<{ file: File; kind: "foto" | "video" } | null>(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const take = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      toast.error("Solo se admiten fotos y vídeos");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("El archivo supera los 80 MB. Graba un vídeo más corto.");
      return;
    }
    setPending({ file, kind: isVideo ? "video" : "foto" });
    setTitle("");
    setComment("");
  };

  /** Genera el informe del golpe con IA y lo guarda en el archivo recién subido. */
  const runAutoAnalysis = async (mediaId: string, file: File, kind: "foto" | "video", fileTitle: string, note: string) => {
    setAnalyzing(true);
    try {
      const frames = await framesFromFile(file, kind);
      const res = await analyze({
        data: {
          studentId: student.id,
          mediaId,
          frames,
          title: fileTitle,
          ...(note ? { focus: note } : {}),
        },
      });
      if (!res.ok) {
        toast.error(res.message || "No se ha podido generar el informe automático");
        return;
      }
      const body = note ? `${note}\n\n${TECHNIQUE_REPORT_MARK}\n${res.analysis}` : `${TECHNIQUE_REPORT_MARK}\n${res.analysis}`;
      await updateMedia(mediaId, { comment: body.slice(0, 4000) });
      toast.success("Informe de técnica generado automáticamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se ha podido generar el informe automático");
    } finally {
      setAnalyzing(false);
    }
  };

  const save = async () => {
    if (!pending) return;
    setUploading(true);
    const file = pending.file;
    const kind = pending.kind;
    const fileTitle = title.trim() || file.name;
    const note = comment.trim();
    try {
      const mediaId = await addMedia(
        {
          studentId: student.id,
          kind,
          title: fileTitle,
          comment: note,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        },
        file,
      );
      toast.success("Archivo subido a la ficha del alumno");
      setPending(null);
      setTitle("");
      setComment("");
      setUploading(false);
      if (autoAnalyze) await runAutoAnalysis(mediaId, file, kind, fileTitle, note);
    } catch {
      toast.error("No se ha podido guardar el archivo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Zona de subida */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed p-5 text-center transition-colors",
          dragging ? "border-primary bg-primary/10" : "border-border bg-card",
        )}
      >
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Upload className="size-5" />
        </span>
        <p className="mt-3 font-display font-semibold">Sube fotos o vídeos de técnica</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Arrastra el archivo aquí, o graba el golpe con el móvil en la pista y súbelo al instante.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button className="h-12 sm:h-10" onClick={() => cameraInput.current?.click()}>
            <Camera /> Grabar ahora
          </Button>
          <Button variant="secondary" className="h-12 sm:h-10" onClick={() => fileInput.current?.click()}>
            <ImagePlus /> Elegir archivo
          </Button>
        </div>
        <input
          ref={cameraInput}
          type="file"
          accept="video/*,image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => take(e.target.files)}
        />
        <input
          ref={fileInput}
          type="file"
          accept="video/*,image/*"
          className="hidden"
          onChange={(e) => take(e.target.files)}
        />
        <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-border bg-secondary/40 p-3 text-left">
          <Sparkles className="size-4 shrink-0 text-primary" />
          <Label htmlFor="auto-analyze" className="flex-1 text-xs leading-snug text-muted-foreground">
            Generar el informe de técnica con IA automáticamente al subir el archivo
          </Label>
          <Switch id="auto-analyze" checked={autoAnalyze} onCheckedChange={setAutoAnalyze} />
        </div>
      </div>

      {analyzing && (
        <p className="flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 p-3 text-sm">
          <Sparkles className="size-4 animate-pulse text-primary" />
          Analizando el golpe con IA… el informe aparecerá en el archivo en unos segundos.
        </p>
      )}


      {/* Formulario del archivo pendiente */}
      {pending && (
        <div className="rounded-2xl border border-primary/40 bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {pending.kind === "video" ? <Video className="size-4 text-primary" /> : <ImagePlus className="size-4 text-primary" />}
            <span className="truncate">{pending.file.name}</span>
            <span className="ml-auto shrink-0 text-xs font-normal text-muted-foreground">
              {(pending.file.size / (1024 * 1024)).toFixed(1)} MB
            </span>
          </p>
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-title">Título</Label>
              <Input
                id="m-title"
                className="h-11"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="Ej. Corrección de empuñadura en la volea"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-comment">Comentarios técnicos o deberes</Label>
              <Textarea
                id="m-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={400}
                className="min-h-24"
                placeholder="Ej. Abre demasiado la pala en la bandeja. Practicar 20 bandejas con el codo alto."
              />
            </div>
            <div className="flex gap-2">
              <Button className="h-12 flex-1" disabled={uploading} onClick={() => void save()}>
                <Save /> {uploading ? "Guardando…" : "Guardar análisis"}
              </Button>
              <Button variant="ghost" className="h-12" onClick={() => setPending(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState title="Sin material multimedia" description="Sube el primer vídeo o foto de técnica de este alumno." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((m) => (
            <MediaCard key={m.id} item={m} student={student} />
          ))}
        </ul>
      )}
    </div>
  );
}
