import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  BOOKING_LABELS,
  COURTS,
  classEndTime,
  overlaps,
  timeToMin,
  todayKey,
  type BookingType,
} from "@/lib/padel";

export function BookingDialog({
  trigger,
  defaultDate,
  defaultCourt,
  defaultStart,
}: {
  trigger: ReactNode;
  defaultDate?: string;
  defaultCourt?: number;
  defaultStart?: string;
}) {
  const { data, addBooking } = useStore();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<BookingType>("alquiler");
  const [date, setDate] = useState(defaultDate ?? todayKey());
  const [court, setCourt] = useState(String(defaultCourt ?? 1));
  const [start, setStart] = useState(defaultStart ?? "19:00");
  const [end, setEnd] = useState(defaultStart ? classEndTime(defaultStart, 90) : "20:30");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setType("alquiler");
    setDate(defaultDate ?? todayKey());
    setCourt(String(defaultCourt ?? 1));
    setStart(defaultStart ?? "19:00");
    setEnd(defaultStart ? classEndTime(defaultStart, 90) : "20:30");
    setName("");
    setPhone("");
    setNotes("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = Number(court);
    if (timeToMin(end) <= timeToMin(start)) {
      toast.error("La hora de fin debe ser posterior a la de inicio");
      return;
    }
    if (!name.trim()) {
      toast.error(type === "alquiler" ? "Indica el nombre de quien reserva" : "Indica el nombre de la clase");
      return;
    }
    const classClash = data.classes.some(
      (k) => k.date === date && k.court === c && overlaps(start, end, k.time, classEndTime(k.time, k.durationMin)),
    );
    if (classClash) {
      toast.error(`La pista ${c} ya tiene una clase del calendario en esa franja`);
      return;
    }
    const bookingClash = data.bookings.some(
      (b) => b.date === date && b.court === c && overlaps(start, end, b.start, b.end),
    );
    if (bookingClash) {
      toast.error(`La pista ${c} ya está reservada en esa franja`);
      return;
    }
    addBooking({
      court: c,
      date,
      start,
      end,
      type,
      name: name.trim(),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    toast.success(type === "alquiler" ? "Pista reservada" : "Pista bloqueada para clase");
    setOpen(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reservar pista</DialogTitle>
          <DialogDescription>Bloquea la pista para una clase de la escuela o para alquiler libre.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["clase", "alquiler"] as BookingType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-sm font-semibold transition-colors",
                  type === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent",
                )}
              >
                {BOOKING_LABELS[t]}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="b-date">Fecha</Label>
              <Input id="b-date" type="date" className="h-11" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Pista</Label>
              <Select value={court} onValueChange={setCourt}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COURTS.map((c) => (
                    <SelectItem key={c} value={String(c)}>Pista {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-start">Hora de inicio</Label>
              <Input id="b-start" type="time" className="h-11" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-end">Hora de fin</Label>
              <Input id="b-end" type="time" className="h-11" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-name">{type === "alquiler" ? "Nombre de quien reserva" : "Nombre de la clase"}</Label>
            <Input
              id="b-name"
              className="h-11"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "alquiler" ? "Ej. Ana y Miguel" : "Ej. Clase de tecnificación"}
            />
          </div>

          {type === "alquiler" && (
            <div className="space-y-1.5">
              <Label htmlFor="b-phone">Teléfono (opcional)</Label>
              <Input id="b-phone" className="h-11" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="600 000 000" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="b-notes">Notas (opcional)</Label>
            <Textarea id="b-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} className="min-h-16" />
          </div>

          <Button type="submit" className="h-12 w-full">Guardar reserva</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
