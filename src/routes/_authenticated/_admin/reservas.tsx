import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarPlus, ChevronLeft, ChevronRight, Clock, Lock, Plus, Radio, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { BookingDialog } from "@/components/booking-dialog";
import { ClubHoursDialog } from "@/components/club-hours-dialog";
import { WhatsAppButton, generalReminder } from "@/components/whatsapp-dialog";
import { EmptyState } from "@/components/padel-ui";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  BOOKING_LABELS,
  COURTS,
  classEndTime,
  clubHoursForDate,
  hourSlots,
  overlaps,
  timeToMin,
  todayKey,
} from "@/lib/padel";

export const Route = createFileRoute("/_authenticated/_admin/reservas")({
  head: () => ({
    meta: [
      { title: "Reservas de pistas — Padel Time" },
      { name: "description", content: "Cuadrante horario de las pistas: clases de la escuela y alquiler libre, sin duplicidades." },
      { property: "og:title", content: "Reservas de pistas — Padel Time" },
      { property: "og:description", content: "Cuadrante horario de las pistas: clases de la escuela y alquiler libre, sin duplicidades." },
    ],
  }),
  component: BookingsPage,
});

type Slot =
  | { kind: "libre" }
  | { kind: "clase-calendario"; id: string; label: string; sub: string; start: string; end: string }
  | { kind: "reserva"; id: string; label: string; sub: string; type: "clase" | "alquiler"; start: string; end: string; phone?: string | undefined };

function BookingsPage() {
  const { data, deleteBooking, hydrated } = useStore();
  const [dayOffset, setDayOffset] = useState(0);
  const [slotTarget, setSlotTarget] = useState<{ court: number; start: string } | null>(null);

  const selected = addDays(new Date(), dayOffset);
  const dateKey = format(selected, "yyyy-MM-dd");

  const dayClasses = useMemo(() => data.classes.filter((c) => c.date === dateKey), [data.classes, dateKey]);
  const dayBookings = useMemo(() => data.bookings.filter((b) => b.date === dateKey), [data.bookings, dateKey]);

  // Horario real del club para el día seleccionado
  const clubDay = clubHoursForDate(data.clubHours, selected);
  const hours = useMemo(
    () => (clubDay.closed ? [] : hourSlots(clubDay.open, clubDay.close)),
    [clubDay.closed, clubDay.open, clubDay.close],
  );

  // Reloj para saber qué franja se está jugando ahora mismo
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const isToday = isSameDay(selected, now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const currentHour = isToday ? hours.find((h) => timeToMin(h) <= nowMin && nowMin < timeToMin(h) + 60) : undefined;

  const slotFor = (court: number, hour: string): Slot => {
    const hourEnd = classEndTime(hour, 60);
    const cls = dayClasses.find(
      (c) => c.court === court && overlaps(hour, hourEnd, c.time, classEndTime(c.time, c.durationMin)),
    );
    if (cls) {
      const coach = data.coaches.find((x) => x.id === cls.coachId);
      return {
        kind: "clase-calendario",
        id: cls.id,
        label: "Clase de la escuela",
        sub: `${coach?.name ?? "Profesor"} · ${cls.studentIds.length}/4`,
        start: cls.time,
        end: classEndTime(cls.time, cls.durationMin),
      };
    }
    const bk = dayBookings.find((b) => b.court === court && overlaps(hour, hourEnd, b.start, b.end));
    if (bk) {
      return {
        kind: "reserva",
        id: bk.id,
        label: bk.name,
        sub: BOOKING_LABELS[bk.type],
        type: bk.type,
        start: bk.start,
        end: bk.end,
        phone: bk.phone,
      };
    }
    return { kind: "libre" };
  };

  const occupiedSlots = COURTS.reduce(
    (n, court) => n + hours.filter((h) => slotFor(court, h).kind !== "libre").length,
    0,
  );
  const totalSlots = COURTS.length * hours.length;

  /** Pistas ocupadas en la franja que se está jugando ahora mismo. */
  const occupiedNow = currentHour
    ? COURTS.map((court) => ({ court, slot: slotFor(court, currentHour) })).filter((x) => x.slot.kind !== "libre")
    : [];

  const agenda = [
    ...dayClasses.map((c) => ({
      id: c.id,
      court: c.court,
      start: c.time,
      end: classEndTime(c.time, c.durationMin),
      title: "Clase de la escuela",
      sub: data.coaches.find((x) => x.id === c.coachId)?.name ?? "Profesor",
      removable: false as const,
      phone: undefined as string | undefined,
    })),
    ...dayBookings.map((b) => ({
      id: b.id,
      court: b.court,
      start: b.start,
      end: b.end,
      title: b.name,
      sub: BOOKING_LABELS[b.type],
      removable: true as const,
      phone: b.phone,
    })),
  ].sort((a, b) => timeToMin(a.start) - timeToMin(b.start) || a.court - b.court);

  return (
    <>
      <PageHeader
        title="Reservas de pistas"
        subtitle={hydrated ? `${occupiedSlots} de ${totalSlots} franjas ocupadas` : undefined}
        action={
          <BookingDialog
            defaultDate={dateKey}
            trigger={
              <Button>
                <CalendarPlus /> Nueva reserva
              </Button>
            }
          />
        }
      />

      {/* Selector de día */}
      <div className="rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" aria-label="Día anterior" onClick={() => setDayOffset((d) => d - 1)}>
            <ChevronLeft />
          </Button>
          <p className="font-display text-sm font-semibold first-letter:uppercase">
            {format(selected, "EEEE d 'de' MMMM", { locale: es })}
            {isSameDay(selected, parseISO(todayKey())) && <span className="ml-2 text-primary">hoy</span>}
          </p>
          <Button variant="ghost" size="icon" aria-label="Día siguiente" onClick={() => setDayOffset((d) => d + 1)}>
            <ChevronRight />
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {clubDay.closed ? "El club está cerrado este día" : `El club abre de ${clubDay.open} a ${clubDay.close}`}
          </p>
          <ClubHoursDialog
            trigger={
              <Button variant="secondary" size="sm">
                <Clock /> Horario del club
              </Button>
            }
          />
        </div>
      </div>

      {/* Ahora mismo */}
      {isToday && !clubDay.closed && (
        <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            <Radio className="size-4" /> Ahora mismo · {currentHour ?? format(now, "HH:mm")}
          </p>
          {!currentHour ? (
            <p className="mt-1 text-xs text-muted-foreground">Fuera del horario de apertura del club.</p>
          ) : occupiedNow.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">Las {COURTS.length} pistas están libres en esta franja.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {occupiedNow.map(({ court, slot }) => (
                <li key={court} className="flex items-center gap-2 text-xs">
                  <span className="rounded-lg bg-primary/15 px-2 py-0.5 font-semibold text-primary">Pista {court}</span>
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {slot.kind === "libre" ? "" : slot.label}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {slot.kind === "libre" ? "" : `hasta ${slot.end}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Cuadrante */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
        <div className="min-w-[540px]">
          <div
            className="grid border-b border-border bg-secondary/60 text-xs font-semibold"
            style={{ gridTemplateColumns: `64px repeat(${COURTS.length}, minmax(0,1fr))` }}
          >
            <span className="px-2 py-2.5 text-muted-foreground">Hora</span>
            {COURTS.map((c) => (
              <span key={c} className="border-l border-border px-2 py-2.5 text-center">Pista {c}</span>
            ))}
          </div>
          {hours.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              El club está cerrado este día: no hay franjas disponibles.
            </p>
          )}
          {hours.map((hour) => (
            <div
              key={hour}
              className={cn(
                "grid border-b border-border last:border-0",
                hour === currentHour && "bg-primary/5 ring-1 ring-inset ring-primary/40",
              )}
              style={{ gridTemplateColumns: `64px repeat(${COURTS.length}, minmax(0,1fr))` }}
            >
              <span className="flex items-center px-2 py-1 font-mono text-xs text-muted-foreground">{hour}</span>
              {COURTS.map((court) => {
                const slot = slotFor(court, hour);
                if (slot.kind === "libre") {
                  return (
                    <button
                      key={court}
                      onClick={() => setSlotTarget({ court, start: hour })}
                      className="group flex min-h-14 items-center justify-center border-l border-border text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      aria-label={`Reservar pista ${court} a las ${hour}`}
                    >
                      <Plus className="size-4 opacity-40 transition-opacity group-hover:opacity-100" />
                    </button>
                  );
                }
                const isSchool = slot.kind === "clase-calendario" || slot.type === "clase";
                return (
                  <div
                    key={court}
                    className={cn(
                      "min-h-14 border-l border-border p-1.5 text-left",
                      isSchool ? "bg-primary/15" : "bg-warning/15",
                    )}
                  >
                    <p className={cn("flex items-center gap-1 text-[11px] font-bold leading-tight", isSchool ? "text-primary" : "text-warning")}>
                      {isSchool ? <Users className="size-3 shrink-0" /> : <Lock className="size-3 shrink-0" />}
                      <span className="truncate">Ocupada</span>
                    </p>
                    <p className="truncate text-[11px] leading-tight text-foreground">{slot.label}</p>
                    <p className="truncate text-[10px] leading-tight text-muted-foreground">
                      {slot.start}–{slot.end}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-primary/40" /> Clase de la escuela</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-warning/40" /> Alquiler libre</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-border" /> Libre · pulsa para reservar</span>
      </div>

      {/* Agenda del día */}
      <h2 className="mb-3 mt-7 text-lg font-semibold">Reservas del día</h2>
      {agenda.length === 0 ? (
        <EmptyState title="Ninguna pista reservada" description="Pulsa una franja libre del cuadrante para reservar." />
      ) : (
        <ul className="space-y-2">
          {agenda.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-secondary py-1.5 font-display">
                <span className="text-sm font-bold">{a.start}</span>
                <span className="text-[10px] text-muted-foreground">{a.end}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{a.title}</p>
                <p className="truncate text-xs text-muted-foreground">Pista {a.court} · {a.sub}</p>
              </div>
              {a.phone && (
                <WhatsAppButton
                  iconOnly
                  label={`Avisar a ${a.title}`}
                  message={{ to: a.title, phone: a.phone, kind: "Recordatorio de reserva", body: generalReminder(a.title) }}
                />
              )}
              {a.removable ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar reserva"
                  onClick={() => {
                    void deleteBooking(a.id);
                    toast.success("Reserva eliminada");
                  }}
                >
                  <Trash2 />
                </Button>
              ) : (
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">Calendario</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <BookingDialog
        defaultDate={dateKey}
        {...(slotTarget ? { defaultCourt: slotTarget.court, defaultStart: slotTarget.start } : {})}
        open={slotTarget !== null}
        onOpenChange={(v) => {
          if (!v) setSlotTarget(null);
        }}
      />
    </>
  );
}
