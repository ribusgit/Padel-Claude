import { useState } from "react";
import { Check, Copy, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { monthKey } from "@/lib/padel";

const MONTHS_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
import { useStore } from "@/lib/store";

interface BizumDialogProps {
  studentId: string;
  studentName: string;
  amount: number;
  /** Mes a pagar (yyyy-MM); por defecto el mes en curso. */
  month?: string;
  /** Si es true, un administrador confirma el cobro; si es false (portal del alumno) solo muestra instrucciones. */
  canConfirm?: boolean;
  triggerLabel?: string;
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS_ES[(m ?? 1) - 1]} ${y}`;
}

/** Instrucciones de pago por Bizum y, para el administrador, confirmación del cobro. */
export function BizumDialog({ studentId, studentName, amount, month, canConfirm, triggerLabel }: BizumDialogProps) {
  const { data, setPaid } = useStore();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const targetMonth = month ?? monthKey();
  const concept = `Cuota ${studentName} — ${monthLabel(targetMonth)}`;
  const phone = data.bizumPhone.trim();

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Copiado al portapapeles");
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const confirm = async () => {
    setSaving(true);
    try {
      await setPaid(studentId, true, "bizum");
      toast.success(`Bizum de ${studentName} registrado`);
      setOpen(false);
    } catch {
      toast.error("No se pudo registrar el cobro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Pagar por Bizum la cuota de ${studentName}`}>
          <Smartphone className="size-4" /> {triggerLabel ?? "Bizum"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Pago por Bizum</DialogTitle>
          <DialogDescription>{concept}</DialogDescription>
        </DialogHeader>
        {phone ? (
          <div className="space-y-3 py-2">
            <div className="rounded-xl border bg-muted/40 p-4 text-center">
              <p className="text-xs text-muted-foreground">Envía un Bizum de</p>
              <p className="text-3xl font-bold tracking-tight text-primary">{amount} €</p>
              <p className="mt-1 text-xs text-muted-foreground">al número</p>
              <p className="text-xl font-semibold">{phone}</p>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-xs text-muted-foreground">Concepto</p>
              <p className="font-medium">{concept}</p>
            </div>
            <Button variant="secondary" className="w-full" onClick={() => copy(`${amount} € · ${phone} · ${concept}`)}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />} Copiar datos del pago
            </Button>
            <p className="text-xs text-muted-foreground">
              Cuando el Bizum llegue, la escuela confirmará el cobro y tu cuota quedará marcada como pagada.
            </p>
          </div>
        ) : (
          <p className="py-2 text-sm text-muted-foreground">
            El club aún no ha configurado su número de Bizum. El administrador puede añadirlo en Pagos → Tarifas y Bizum.
          </p>
        )}
        {canConfirm && phone ? (
          <DialogFooter>
            <Button onClick={() => void confirm()} disabled={saving}>
              {saving ? "Registrando…" : "Confirmar Bizum recibido"}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
