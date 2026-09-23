import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { addDays, format, isSameDay, parseISO, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarPlus, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { LevelBadge } from "@/components/padel-ui";
import { ClassDialog } from "@/components/class-dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { COURT_HOURS, todayKey, type ClassSession } from "@/lib/padel";

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

function SchedulePage() {
  const { data, deleteClass } = useStore();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const classAt = (day: Date, hour: string): ClassSession[] => {
    const key = format(day, "yyyy-MM-dd");
    return data.classes
      .filter((c) => c.date === key && c.time === hour)
      .sort((a, b) => a.court - b.court);
  };

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
        Toca una celda vacía para programar una clase en ese día y hora. Las clases creadas aquí bloquean la pista en el cuadrante de reservas automáticamente.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 w-14 bg-card p-2 text-left text-xs font-medium text-muted-foreground">Hora</th>
              {days.map((d) => {
                const today = isSameDay(d, new Date());
                return (
                  <th key={d.toISOString()} className={cn("p-2 text-center", today && "bg-primary/5")}>
                    <span className="block text-[11px] uppercase text-muted-foreground">{format(d, "EEE", { locale: es })}</span>
                    <span className={cn("font-display text-base font-bold", today && "text-primary")}>{format(d, "d")}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {COURT_HOURS.map((hour) => (
              <tr key={hour} className="border-b border-border/60 last:border-0">
                <td className="sticky left-0 z-10 bg-card p-2 font-display text-xs font-semibold text-muted-foreground">{hour}</td>
                {days.map((d) => {
                  const classes = classAt(d, hour);
                  const dateKey = format(d, "yyyy-MM-dd");
                  return (
                    <td key={d.toISOString()} className={cn("align-top p-1", isSameDay(d, new Date()) && "bg-primary/5")}>
                      {classes.length === 0 ? (
                        dateKey >= todayKey() ? (
                          <ClassDialog
                            defaultDate={dateKey}
                            defaultTime={hour}
                            trigger={
                              <button
                                className="flex h-12 w-full items-center justify-center rounded-lg border border-dashed border-border/70 text-muted-foreground/50 transition-colors hover:border-primary/60 hover:text-primary"
                                aria-label={`Programar clase el ${format(d, "EEEE d", { locale: es })} a las ${hour}`}
                              >
                                <Plus className="size-4" />
                              </button>
                            }
                          />
                        ) : (
                          <div className="h-12" />
                        )
                      ) : (
                        <ul className="space-y-1">
                          {classes.map((c) => {
                            const coach = data.coaches.find((x) => x.id === c.coachId);
                            return (
                              <li
                                key={c.id}
                                className="group rounded-lg border border-primary/30 bg-primary/10 px-2 py-1.5"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-bold">Pista {c.court}</span>
                                  <button
                                    onClick={() => {
                                      void deleteClass(c.id);
                                      toast.success("Clase eliminada");
                                    }}
                                    className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                                    aria-label="Eliminar clase"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                                <p className="truncate text-[11px] text-muted-foreground">{coach?.name ?? "Sin profesor"}</p>
                                <div className="mt-1 flex items-center justify-between gap-1">
                                  <LevelBadge category={c.level} />
                                  <span className="text-[10px] text-muted-foreground">{c.studentIds.length}/4</span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
