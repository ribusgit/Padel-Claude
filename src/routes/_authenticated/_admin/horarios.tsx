import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { addDays, format, isSameDay, parseISO, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarPlus, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { LevelBadge } from "@/components/padel-ui";
import { ClassDialog } from "@/components/class-dialog";
import { ClassRemindersButton } from "@/components/class-reminders-button";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { HALF_HOUR_SLOTS, classEndTime, timeToMin, todayKey, type ClassSession } from "@/lib/padel";

export const Route = createFileRoute("/_authenticated/_admin/horarios")({
  head: () => ({
    meta: [
      { title: "Horarios de clases — Escuela de Pádel" },
      { name: "description", content: "Parrilla semanal de clases por día, hora, pista y profesor. Sincronizada con el cuadrante de pistas." },
      { property: "og:title", content: "Horarios de clases — Escuela de Pádel" },
      { property: "og:description", content: "Parrilla semanal de clases por día, hora, pista y profesor. Sincronizada con el cuadrante de pistas." },
    ],
  }),
  component: SchedulePage,
});

/** Alto en píxeles de cada franja de media hora. */
const ROW_H = 44;
const DAY_START_MIN = timeToMin(HALF_HOUR_SLOTS[0] ?? "07:00");

interface PositionedClass {
  session: ClassSession;
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
}

/** Coloca cada clase en su posición vertical exacta y reparte carriles horizontales cuando se solapan. */
function positionClasses(classes: ClassSession[]): PositionedClass[] {
  const sorted = [...classes].sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
  const result: PositionedClass[] = [];
  let cluster: ClassSession[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    // Asignación de carriles: cada clase va al primer carril libre.
    const laneEnds: number[] = [];
    const lanes = new Map<string, number>();
    for (const c of cluster) {
      const start = timeToMin(c.time);
      const end = start + (c.durationMin || 60);
      let lane = laneEnds.findIndex((e) => e <= start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(end);
      } else {
        laneEnds[lane] = end;
      }
      lanes.set(c.id, lane);
    }
    const laneCount = laneEnds.length;
    for (const c of cluster) {
      const start = timeToMin(c.time);
      const dur = c.durationMin || 60;
      const lane = lanes.get(c.id) ?? 0;
      result.push({
        session: c,
        top: ((start - DAY_START_MIN) / 30) * ROW_H,
        height: Math.max((dur / 30) * ROW_H - 4, 24),
        leftPct: (lane / laneCount) * 100,
        widthPct: 100 / laneCount,
      });
    }
    cluster = [];
    clusterEnd = -1;
  };

  for (const c of sorted) {
    const start = timeToMin(c.time);
    const end = start + (c.durationMin || 60);
    if (cluster.length > 0 && start >= clusterEnd) flush();
    cluster.push(c);
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();
  return result;
}

function SchedulePage() {
  const { data, deleteClass } = useStore();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const classesForDay = (day: Date): ClassSession[] => {
    const key = format(day, "yyyy-MM-dd");
    return data.classes.filter((c) => c.date === key);
  };

  const gridHeight = HALF_HOUR_SLOTS.length * ROW_H;

  return (
    <>
      <PageHeader
        title="Horarios de clases"
        subtitle={format(weekStart, "'Semana del' d 'de' MMMM", { locale: es })}
        action={
          <ClassDialog
            trigger={
              <Button>
                <CalendarPlus /> Nueva clase
              </Button>
            }
          />
        }
      />

      <div className="mb-3 flex items-center justify-between rounded-2xl border border-border bg-card px-2 py-1.5">
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Semana anterior">
          <ChevronLeft />
        </Button>
        <button
          className="text-sm font-medium text-primary"
          onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
        >
          Semana actual
        </button>
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Semana siguiente">
          <ChevronRight />
        </Button>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Toca una franja vacía para programar una clase en ese día y hora. Cada clase ocupa exactamente el espacio entre su hora de inicio y de final, y bloquea la pista en el cuadrante de reservas automáticamente.
      </p>

      <div className="rounded-2xl border border-border bg-card">
        <div>
          {/* Cabecera de días */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border">
            <div className="sticky left-0 z-20 bg-card p-2 text-xs font-medium text-muted-foreground">Hora</div>
            {days.map((d) => {
              const today = isSameDay(d, new Date());
              return (
                <div key={d.toISOString()} className={cn("p-2 text-center", today && "bg-primary/5")}>
                  <span className="block text-[11px] uppercase text-muted-foreground">{format(d, "EEE", { locale: es })}</span>
                  <span className={cn("font-display text-base font-bold", today && "text-primary")}>{format(d, "d")}</span>
                </div>
              );
            })}
          </div>

          {/* Cuadrícula */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)]">
            {/* Columna de horas */}
            <div className="sticky left-0 z-20 bg-card">
              {HALF_HOUR_SLOTS.map((hour) => (
                <div
                  key={hour}
                  style={{ height: ROW_H }}
                  className={cn(
                    "border-b px-2 pt-0.5 font-display text-xs font-semibold",
                    hour.endsWith(":30") ? "border-border/30 text-muted-foreground/60" : "border-border/60 text-muted-foreground",
                  )}
                >
                  {hour}
                </div>
              ))}
            </div>

            {/* Columnas de días */}
            {days.map((d) => {
              const dateKey = format(d, "yyyy-MM-dd");
              const isToday = isSameDay(d, new Date());
              const positioned = positionClasses(classesForDay(d));
              const canAdd = dateKey >= todayKey();
              return (
                <div key={d.toISOString()} className={cn("relative border-l border-border/40", isToday && "bg-primary/5")} style={{ height: gridHeight }}>
                  {/* Franjas vacías pulsables */}
                  {HALF_HOUR_SLOTS.map((hour, i) => (
                    <div
                      key={hour}
                      className={cn("group/slot border-b", hour.endsWith(":30") ? "border-border/30" : "border-border/60")}
                      style={{ height: ROW_H }}
                    >
                      {canAdd && (
                        <ClassDialog
                          defaultDate={dateKey}
                          defaultTime={hour}
                          trigger={
                            <button
                              className="flex h-full w-full items-center justify-center text-transparent transition-colors hover:bg-primary/5 hover:text-primary/70"
                              aria-label={`Programar clase el ${format(d, "EEEE d", { locale: es })} a las ${hour}`}
                            >
                              <Plus className="size-4" />
                            </button>
                          }
                        />
                      )}
                    </div>
                  ))}

                  {/* Clases posicionadas de forma absoluta */}
                  {positioned.map(({ session: c, top, height, leftPct, widthPct }) => {
                    const coach = data.coaches.find((x) => x.id === c.coachId);
                    const compact = height < 80;
                    return (
                      <div
                        key={c.id}
                        className="group absolute z-10 overflow-hidden rounded-lg border border-primary/30 bg-primary/10 px-2 py-1"
                        style={{ top: top + 2, height, left: `calc(${leftPct}% + 2px)`, width: `calc(${widthPct}% - 4px)` }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-xs font-bold">
                            Pista {c.court} · {c.time}–{classEndTime(c.time, c.durationMin || 60)}
                          </span>
                          <span className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <ClassDialog
                              session={c}
                              trigger={
                                <button className="text-muted-foreground transition-colors hover:text-primary" aria-label="Editar clase">
                                  <Pencil className="size-3.5" />
                                </button>
                              }
                            />
                            <button
                              onClick={() => {
                                void deleteClass(c.id);
                                toast.success("Clase eliminada");
                              }}
                              className="text-muted-foreground transition-colors hover:text-destructive"
                              aria-label="Eliminar clase"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </span>
                        </div>
                        {!compact && (
                          <>
                            <p className="truncate text-[11px] text-muted-foreground">{coach?.name ?? "Sin profesor"}</p>
                            <div className="mt-1 flex items-center justify-between gap-1">
                              <LevelBadge category={c.level} />
                              {c.isTrial && (
                                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">Prueba · gratis</span>
                              )}
                              <span className="text-[10px] text-muted-foreground">{c.studentIds.length}/4</span>
                            </div>
                            {c.studentIds.length > 0 && height >= 120 && (
                              <div className="mt-1.5">
                                <ClassRemindersButton session={c} label="Avisar" />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
