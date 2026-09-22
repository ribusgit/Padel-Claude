import { useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Icono de WhatsApp (inline para no depender de otra librería). */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={cn("size-4", className)}>
      <path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.12-.41-2.13-1.31-.79-.7-1.31-1.57-1.46-1.87-.15-.3-.02-.47.13-.62.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.34 5.1 4.56.71.31 1.27.49 1.7.63.72.23 1.37.2 1.89.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35ZM12.05 21.8h-.01a9.7 9.7 0 0 1-4.94-1.35l-.35-.21-3.67.96.98-3.58-.23-.37a9.72 9.72 0 0 1-1.49-5.19c0-5.37 4.37-9.74 9.75-9.74a9.68 9.68 0 0 1 6.89 2.86 9.66 9.66 0 0 1 2.85 6.89c0 5.37-4.37 9.73-9.78 9.73ZM20.5 3.49A11.62 11.62 0 0 0 12.05 0C5.6 0 .35 5.25.35 11.7c0 2.06.54 4.07 1.56 5.85L.2 24l6.61-1.73a11.66 11.66 0 0 0 5.24 1.33h.01c6.45 0 11.7-5.25 11.7-11.7 0-3.12-1.22-6.06-3.26-8.41Z" />
    </svg>
  );
}

export interface WhatsAppMessage {
  /** Nombre del destinatario, para el encabezado del modal. */
  to: string;
  phone?: string | undefined;
  /** Texto exacto que recibiría el alumno. */
  body: string;
  /** Etiqueta contextual, p. ej. "Recordatorio de pago". */
  kind: string;
}

export function WhatsAppPreviewDialog({
  message,
  open,
  onOpenChange,
}: {
  message: WhatsAppMessage | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const current = text || message?.body || "";

  const waLink = message?.phone
    ? `https://wa.me/${message.phone.replace(/\D/g, "")}?text=${encodeURIComponent(current)}`
    : `https://wa.me/?text=${encodeURIComponent(current)}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setText("");
          setSent(false);
        }
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
              <WhatsAppIcon />
            </span>
            {message?.kind ?? "Notificación"}
          </DialogTitle>
          <DialogDescription>
            Vista previa del mensaje para {message?.to ?? "el alumno"}
            {message?.phone ? ` · ${message.phone}` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Simulación de conversación */}
        <div className="rounded-2xl border border-border bg-secondary/50 p-3">
          <div className="ml-auto max-w-[92%] rounded-2xl rounded-br-sm bg-[#25D366]/15 p-3 text-sm leading-relaxed whitespace-pre-wrap">
            {current}
            <span className="mt-1 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
              ahora <Check className="size-3" />
              <Check className="-ml-2 size-3" />
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Editar antes de enviar</p>
          <Textarea
            value={current}
            onChange={(e) => setText(e.target.value)}
            className="min-h-24 text-sm"
            maxLength={800}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            className="sm:flex-1"
            onClick={() => {
              void navigator.clipboard?.writeText(current);
              toast.success("Mensaje copiado");
            }}
          >
            <Copy /> Copiar
          </Button>
          <Button asChild variant="secondary" className="sm:flex-1">
            <a href={waLink} target="_blank" rel="noreferrer">
              <ExternalLink /> Abrir WhatsApp
            </a>
          </Button>
          <Button
            className="sm:flex-1"
            onClick={() => {
              setSent(true);
              toast.success(`Recordatorio enviado a ${message?.to ?? "el alumno"} (simulado)`);
              onOpenChange(false);
            }}
          >
            {sent ? <Check /> : <Send />} Enviar
          </Button>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">
          Envío simulado: no se manda ningún mensaje real.
        </p>
      </DialogContent>
    </Dialog>
  );
}

/** Botón autónomo con su propio modal de previsualización. */
export function WhatsAppButton({
  message,
  label = "Notificar",
  size = "sm",
  variant = "secondary",
  iconOnly = false,
  className,
  children,
}: {
  message: WhatsAppMessage;
  label?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "secondary" | "outline" | "ghost" | "default";
  iconOnly?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        size={iconOnly ? "icon" : size}
        variant={variant}
        aria-label={iconOnly ? label : undefined}
        className={cn("text-[#25D366]", className)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <WhatsAppIcon />
        {!iconOnly && (children ?? label)}
      </Button>
      <WhatsAppPreviewDialog message={message} open={open} onOpenChange={setOpen} />
    </>
  );
}

/* ---------- Plantillas de mensajes ---------- */

export function paymentReminder(name: string, amount: number, month: string) {
  return `Hola ${name} 👋\n\nTe recordamos que está pendiente el pago de la mensualidad de pádel de ${month} (${amount} €).\n\nPuedes abonarlo en recepción o por transferencia antes del día 5. ¡Gracias!\n\n— Escuela de Pádel`;
}

export function classReminder(name: string, time: string, court: number, coach: string, dayLabel: string) {
  return `Hola ${name} 👋\n\nRecuerda tu clase de ${dayLabel} a las ${time} en la Pista ${court} con el profesor ${coach}.\n\nVen 10 minutos antes para calentar. ¡Te esperamos!\n\n— Escuela de Pádel`;
}

export function generalReminder(name: string) {
  return `Hola ${name} 👋\n\nTe escribimos desde la Escuela de Pádel para recordarte tus próximas clases y mantenerte al día.\n\n¿Alguna duda? Responde a este mensaje.\n\n— Escuela de Pádel`;
}

export function mediaReminder(name: string, title: string, comment: string) {
  return `Hola ${name} 👋\n\nTu profesor ha subido un nuevo análisis de técnica: «${title}».\n\n${comment || "Revísalo antes de la próxima clase."}\n\n— Escuela de Pádel`;
}
