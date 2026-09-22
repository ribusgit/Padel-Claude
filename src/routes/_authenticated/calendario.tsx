import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { addDays, format, isSameDay, parseISO, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarPlus, ChevronLeft, ChevronRight, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { LevelBadge, EmptyState } from "@/components/padel-ui";
import { WhatsAppButton, classReminder } from "@/components/whatsapp-dialog";
import { ClassDialog } from "@/components/class-dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LEVEL_LABELS, MAX_STUDENTS_PER_CLASS, type LevelCategory } from "@/lib/padel";

export const Route = createFileRoute("/_authenticated/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario de clases — Escuela de Pádel" },
      { name: "description", content: "Programa clases por día, hora, pista, profesor y nivel, con máximo 4 alumnos." },
      { property: "og:title", content: "Calendario de clases — Escuela de Pádel" },
      { property: "og:description", content: "Programa clases por día, hora, pista, profesor y nivel, con máximo 4 alumnos." },
    ],
  }),
  component: CalendarPage,
});

type Filter = "todos" | LevelCategory;

function CalendarPage() {
  const { data, deleteClass } = useStore();
  const [selected, setSelected] = useState(() => new Date());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [filter, setFilter] = useState<Filter>("todos");

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const selectedKey = format(selected, "yyyy-MM-dd");

  const dayClasses = data.classes
    .filter((c) => c.date === selectedKey)
    .filter((c) => filter === "todos" || c.level === filter)
    .sort((a, b) => a.time.localeCompare(b.time) || a.court - b.court);

  const countFor = (d: Date) => data.classes.filter((c) => isSameDay(parseISO(c.date), d)).length;

  return (
    <>
      <PageHeader
        title="Horarios y clases"
        subtitle={format(weekStart, "'Semana del' d 'de' MMMM", { locale: es })}
        action={
          <ClassDialog
            defaultDate={selectedKey}
            trigger={
              <Button>
                <CalendarPlus /> Nueva clase
              </Button>
            }
          />
        }
      />

      <div className="rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center justify-between px-1">
          <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Semana anterior">
            <ChevronLeft />
          </Button>
          <button
            className="text-sm font-medium text-primary"
            onClick={() => {
              const t = new Date();
              setSelected(t);
              setWeekStart(startOfWeek(t, { weekStartsOn: 1 }));
            }}
          >
            Hoy
          </button>
          <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Semana siguiente">
            <ChevronRight />
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {days.map((d) => {
            const active = isSameDay(d, selected);
            const today = isSameDay(d, new Date());
            const n = countFor(d);
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelected(d)}
                className={cn(
                  "flex flex-col items-center rounded-xl py-2 transition-colors",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                )}
              >
                <span className={cn("text-[11px] uppercase", active ? "opacity-80" : "text-muted-foreground")}>
                  {format(d, "EEE", { locale: es })}
                </span>
                <span className={cn("font-display text-lg font-bold", today && !active && "text-primary")}>{format(d, "d")}</span>
                <span className="mt-0.5 flex h-1.5 gap-0.5">
                  {Array.from({ length: Math.min(n, 3) }).map((_, i) => (
                    <span key={i} className={cn("size-1.5 rounded-full", active ? "bg-primary-foreground/70" : "bg-primary")} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
        {(["todos", "iniciacion", "intermedio", "avanzado"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent",
            )}
          >
            {f === "todos" ? "Todos los niveles" : LEVEL_LABELS[f]}
          </button>
        ))}
      </div>

      <h2 className="mb-3 mt-5 text-lg font-semibold first-letter:uppercase">
        {format(selected, "EEEE d 'de' MMMM", { locale: es })}
      </h2>

      {dayClasses.length === 0 ? (
        <EmptyState title="No hay clases este día" description="Pulsa «Nueva clase» para programar una." />
      ) : (
        <ul className="space-y-3">
          {dayClasses.map((c) => {
            const coach = data.coaches.find((x) => x.id === c.coachId);
            const students = c.studentIds.map((id) => data.students.find((s) => s.id === id)).filter(Boolean);
            return (
              <li key={c.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex items-stretch">
                  <div className="flex w-20 shrink-0 flex-col items-center justify-center bg-secondary font-display">
                    <span className="text-lg font-bold">{c.time}</span>
                    <span className="text-[11px] text-muted-foreground">{c.durationMin} min</span>
                  </div>
                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">Pista {c.court}</p>
                      <LevelBadge category={c.level} />
                      <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="size-3.5" /> {c.studentIds.length}/{MAX_STUDENTS_PER_CLASS}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Profesor:{" "}
                      {coach ? (
                        <Link to="/profesores/$id" params={{ id: coach.id }} className="text-foreground underline-offset-2 hover:underline">
                          {coach.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {students.length === 0 && <span className="text-xs text-muted-foreground">Sin alumnos inscritos</span>}
                      {students.map((s) => (
                        <span key={s!.id} className="flex items-center gap-0.5 rounded-full bg-secondary pl-2.5 text-xs font-medium">
                          <Link to="/alumnos/$id" params={{ id: s!.id }} className="py-1 hover:underline">
                            {s!.name}
                          </Link>
                          <WhatsAppButton
                            iconOnly
                            variant="ghost"
                            className="size-7 rounded-full"
                            label={`Enviar recordatorio de clase a ${s!.name}`}
                            message={{
                              to: s!.name,
                              phone: s!.phone,
                              kind: "Recordatorio de clase",
                              body: classReminder(
                                s!.name,
                                c.time,
                                c.court,
                                coach?.name ?? "tu profesor",
                                format(parseISO(c.date), "EEEE d 'de' MMMM", { locale: es }),
                              ),
                            }}
                          />
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      deleteClass(c.id);
                      toast.success("Clase eliminada");
                    }}
                    className="flex w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Eliminar clase"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
