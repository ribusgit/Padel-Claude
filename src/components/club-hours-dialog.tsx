import { useEffect, useState, type ReactNode } from "react";
import { Clock } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";
import { WEEKDAY_LABELS, type ClubDayHours } from "@/lib/padel";

/** Orden de lunes a domingo para editar el horario del club. */
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function ClubHoursDialog({ trigger }: { trigger: ReactNode }) {
  const { data, setClubHours } = useStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ClubDayHours[]>(data.clubHours);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setDraft(data.clubHours);
  }, [open, data.clubHours]);

  const update = (weekday: number, patch: Partial<ClubDayHours>) =>
    setDraft((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)));

  const save = async () => {
    const invalid = draft.find((d) => !d.closed && d.open >= d.close);
    if (invalid) {
      toast.error(`Revisa el ${WEEKDAY_LABELS[invalid.weekday]}: la apertura debe ser antes del cierre`);
      return;
    }
    setSaving(true);
    try {
      await setClubHours(draft);
      toast.success("Horario del club actualizado");
      setOpen(false);
    } catch {
      toast.error("No se pudo guardar el horario");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="size-4 text-primary" /> Horario del club
          </DialogTitle>
          <DialogDescription>
            El cuadrante de pistas solo mostrará las franjas dentro de este horario.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {ORDER.map((weekday) => {
            const day = draft.find((d) => d.weekday === weekday);
            if (!day) return null;
            return (
              <div key={weekday} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2.5">
                <span className="w-24 shrink-0 text-sm font-semibold">{WEEKDAY_LABELS[weekday]}</span>
                {day.closed ? (
                  <span className="flex-1 text-sm text-muted-foreground">Cerrado</span>
                ) : (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      type="time"
                      step={3600}
                      value={day.open}
                      onChange={(e) => update(weekday, { open: e.target.value })}
                      aria-label={`Apertura ${WEEKDAY_LABELS[weekday]}`}
                      className="w-28"
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      type="time"
                      step={3600}
                      value={day.close}
                      onChange={(e) => update(weekday, { close: e.target.value })}
                      aria-label={`Cierre ${WEEKDAY_LABELS[weekday]}`}
                      className="w-28"
                    />
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={!day.closed}
                    onCheckedChange={(v) => update(weekday, { closed: !v })}
                    aria-label={`Abierto ${WEEKDAY_LABELS[weekday]}`}
                  />
                  <span className="text-xs text-muted-foreground">Abierto</span>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? "Guardando…" : "Guardar horario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
