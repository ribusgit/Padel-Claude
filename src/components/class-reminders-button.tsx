import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Send } from "lucide-react";
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
import { WhatsAppIcon, classReminder } from "@/components/whatsapp-dialog";
import { logWhatsAppSent } from "@/lib/whatsapp-log";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ClassSession } from "@/lib/padel";

/**
 * Abre WhatsApp con el recordatorio de clase ya escrito para cada alumno
 * de la clase, uno a uno (el navegador solo permite abrir una app por pulsación).
 */
export function ClassRemindersButton({
  session,
  iconOnly = false,
  label = "Avisar a la clase",
}: {
  session: ClassSession;
  iconOnly?: boolean;
  label?: string;
}) {
  const { data } = useStore();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string[]>([]);

  const coach = data.coaches.find((c) => c.id === session.coachId)?.name ?? "tu profesor";
  const dayLabel = format(parseISO(session.date), "EEEE d 'de' MMMM", { locale: es });
  const students = session.studentIds
    .map((id) => data.students.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const send = (student: (typeof students)[number]) => {
    const body = classReminder(student.name, session.time, session.court, coach, dayLabel);
    const digits = student.phone.replace(/\D/g, "");
    const url = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(body)}`
      : `https://wa.me/?text=${encodeURIComponent(body)}`;
    window.open(url, "_blank", "noreferrer");
    setDone((prev) => (prev.includes(student.id) ? prev : [...prev, student.id]));
    void logWhatsAppSent({
      studentId: student.id,
      recipientName: student.name,
      phone: student.phone,
      kind: "Recordatorio de clase",
      body,
    });
    if (!digits) toast.warning(`${student.name} no tiene teléfono: elige el contacto en WhatsApp`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setDone([]);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          size={iconOnly ? "icon" : "sm"}
          variant="secondary"
          aria-label={iconOnly ? label : undefined}
          className="text-[#25D366]"
          onClick={(e) => e.stopPropagation()}
        >
          <WhatsAppIcon />
          {!iconOnly && label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
              <WhatsAppIcon />
            </span>
            Recordatorio de clase
          </DialogTitle>
          <DialogDescription className="first-letter:uppercase">
            {dayLabel} · {session.time} · Pista {session.court} · {coach}
          </DialogDescription>
        </DialogHeader>

        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">Esta clase todavía no tiene alumnos apuntados.</p>
        ) : (
          <ul className="space-y-2">
            {students.map((s) => {
              const sent = done.includes(s.id);
              return (
                <li key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.phone || "Sin teléfono"}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={sent ? "secondary" : "default"}
                    className={cn(sent && "text-[#25D366]")}
                    onClick={() => send(s)}
                  >
                    {sent ? <Check /> : <Send />} {sent ? "Enviado" : "Enviar"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-[11px] text-muted-foreground">
          Cada botón abre WhatsApp con el mensaje escrito para ese alumno. Se envían de uno en uno porque WhatsApp
          solo puede abrir una conversación cada vez.
        </p>
      </DialogContent>
    </Dialog>
  );
}
