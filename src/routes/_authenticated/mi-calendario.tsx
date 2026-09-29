import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarPlus, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { ClassDialog } from "@/components/class-dialog";
import { LevelBadge } from "@/components/padel-ui";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { classEndTime, todayKey } from "@/lib/padel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/mi-calendario")({
  head: () => ({
    meta: [
      { title: "Mi calendario — Padel Time" },
      { name: "description", content: "Calendario semanal del profesor con sus clases, para ver y ajustar horarios." },
      { property: "og:title", content: "Mi calendario — Padel Time" },
      { property: "og:description", content: "Calendario semanal del profesor con sus clases, para ver y ajustar horarios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoachCalendar,
});

function CoachCalendar() {
  const { data, coachId, isAdmin, loading } = useStore();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = todayKey();

  if (loading) return <p className="py-16 text-center text-sm text-muted-foreground">Cargando…</p>;

  const mine = data.classes.filter((c) => (isAdmin ? true : c.coachId === coachId));

  return (
    <>
      <PageHeader
        title="Mi calendario"
        subtitle={format(weekStart, "'Semana del' d 'de' MMMM", { locale: es })}
        action={<ClassDialog trigger={<Button><CalendarPlus className="size-4" /> Nueva clase</Button>} />}
      />
      <div className="mb-4 flex items-center gap-2">
        <Button variant="secondary" size="icon" aria-label="Semana anterior" onClick={() => setWeekStart((d) => addDays(d, -7))}><ChevronLeft className="size-4" /></Button>
        <Button variant="secondary" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Esta semana</Button>
        <Button variant="secondary" size="icon" aria-label="Semana siguiente" onClick={() => setWeekStart((d) => addDays(d, 7))}><ChevronRight className="size-4" /></Button>
      </div>
      <div className="space-y-3">
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const list = mine.filter((c) => c.date === key).sort((a, b) => a.time.localeCompare(b.time));
          return (
            <section key={key} className={cn("rounded-2xl border bg-card p-3", key === today ? "border-primary" : "border-border")}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold first-letter:uppercase">{format(d, "EEEE d 'de' MMMM", { locale: es })}</p>
                <ClassDialog defaultDate={key} trigger={<Button size="sm" variant="ghost"><CalendarPlus className="size-4" /></Button>} />
              </div>
              {list.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin clases</p>
              ) : (
                <ul className="space-y-2">
                  {list.map((c) => {
                    const ex = c.plan?.split("\n")[0];
                    return (
                      <li key={c.id} className="flex items-center gap-3 rounded-xl bg-secondary/60 p-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{c.time}–{classEndTime(c.time, c.durationMin)} · Pista {c.court}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.studentIds.length}/4 alumnos{ex ? ` · ${ex}` : ""}</p>
                        </div>
                        <LevelBadge category={c.level} />
                        <ClassDialog session={c} trigger={<Button size="icon" variant="ghost" aria-label="Editar clase"><Pencil className="size-4" /></Button>} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
