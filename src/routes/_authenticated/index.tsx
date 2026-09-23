import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Users, CalendarDays, LandPlot, AlertCircle, UserPlus, CalendarPlus, ChevronRight, Clock } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { StatCard, LevelBadge, EmptyState } from "@/components/padel-ui";
import { StudentAvatar } from "@/components/student-avatar";
import { StudentDialog } from "@/components/student-dialog";
import { ClassDialog } from "@/components/class-dialog";
import { BookingDialog } from "@/components/booking-dialog";
import { Button } from "@/components/ui/button";
import { CoachHome } from "@/components/coach-home";
import { useStore } from "@/lib/store";
import { COURTS, todayKey } from "@/lib/padel";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Panel de control — Escuela de Pádel" },
      { name: "description", content: "Resumen diario de alumnos, clases, pistas y pagos de tu escuela de pádel." },
      { property: "og:title", content: "Panel de control — Escuela de Pádel" },
      { property: "og:description", content: "Resumen diario de alumnos, clases, pistas y pagos de tu escuela de pádel." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, hydrated, isAdmin, role } = useStore();
  if (hydrated && role === "coach") return <CoachHome />;
  const today = todayKey();
  const activeStudents = data.students.filter((s) => s.active);
  const todayClasses = data.classes
    .filter((c) => c.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));
  const busyCourts = new Set(todayClasses.map((c) => c.court)).size;
  const pending = activeStudents.filter((s) => s.paymentStatus === "pendiente");

  return (
    <>
      <PageHeader
        title="Panel de control"
        subtitle={hydrated ? format(new Date(), "EEEE, d 'de' MMMM", { locale: es }) : undefined}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard label="Alumnos activos" value={activeStudents.length} icon={Users} tone="primary" hint="en la escuela" />
        <StatCard label="Clases hoy" value={todayClasses.length} icon={CalendarDays} hint={todayClasses[0] ? `primera a las ${todayClasses[0].time}` : "sin clases"} />
        <StatCard label="Pistas ocupadas" value={`${busyCourts}/${COURTS.length}`} icon={LandPlot} hint="hoy" />
        {isAdmin && <StatCard label="Pagos pendientes" value={pending.length} icon={AlertCircle} tone={pending.length ? "warning" : "default"} hint={pending.length ? "requieren atención" : "todo al día"} />}
      </div>

      {isAdmin && <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StudentDialog
          trigger={
            <Button size="lg" className="h-14 justify-start rounded-2xl text-base">
              <UserPlus className="!size-5" /> Añadir nuevo alumno
            </Button>
          }
        />
        <ClassDialog
          trigger={
            <Button size="lg" variant="secondary" className="h-14 justify-start rounded-2xl text-base">
              <CalendarPlus className="!size-5" /> Registrar una clase
            </Button>
          }
        />
        <BookingDialog
          trigger={
            <Button size="lg" variant="secondary" className="h-14 justify-start rounded-2xl text-base">
              <LandPlot className="!size-5" /> Reservar una pista
            </Button>
          }
        />
      </div>}

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Clases de hoy</h2>
            <Link to={isAdmin ? "/calendario" : "/mis-clases"} className="flex items-center text-sm text-primary">
              {isAdmin ? "Ver calendario" : "Mis clases"} <ChevronRight className="size-4" />
            </Link>
          </div>
          {todayClasses.length === 0 ? (
            <EmptyState title="No hay clases programadas hoy" description="Usa «Registrar una clase» para añadir una." />
          ) : (
            <ul className="space-y-2">
              {todayClasses.map((c) => {
                const coach = data.coaches.find((x) => x.id === c.coachId);
                return (
                  <li key={c.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                    <div className="flex flex-col items-center rounded-xl bg-secondary px-3 py-2 font-display">
                      <Clock className="mb-0.5 size-3.5 text-muted-foreground" />
                      <span className="text-sm font-bold">{c.time}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">Pista {c.court}</p>
                        <LevelBadge category={c.level} />
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {coach?.name ?? "Sin profesor"} · {c.studentIds.length}/4 alumnos
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {isAdmin && <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pagos pendientes</h2>
            <Link to="/pagos" className="flex items-center text-sm text-primary">
              Ver todos <ChevronRight className="size-4" />
            </Link>
          </div>
          {pending.length === 0 ? (
            <EmptyState title="Todos los alumnos al día" />
          ) : (
            <ul className="space-y-2">
              {pending.map((s) => (
                <li key={s.id}>
                  <Link
                    to="/alumnos/$id"
                    params={{ id: s.id }}
                    className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-card p-3 transition-colors hover:bg-accent"
                  >
                    <StudentAvatar name={s.name} photoPath={s.photoPath} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.phone}</p>
                    </div>
                    <span className="text-xs font-semibold text-warning">Pendiente</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>}
      </div>
    </>
  );
}
