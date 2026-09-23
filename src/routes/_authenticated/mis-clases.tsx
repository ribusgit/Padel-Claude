import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, X, Users } from "lucide-react";
import { toast } from "sonner";
import { LevelBadge, Avatar, EmptyState } from "@/components/padel-ui";
import { StudentAvatar } from "@/components/student-avatar";
import { WhatsAppButton, classReminder } from "@/components/whatsapp-dialog";
import { ClassWhiteboard } from "@/components/class-whiteboard";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { todayKey } from "@/lib/padel";

export const Route = createFileRoute("/_authenticated/mis-clases")({
  head: () => ({
    meta: [
      { title: "Mis clases de hoy — Escuela de Pádel" },
      { name: "description", content: "Vista de pista del profesor: clases del día y asistencia de un toque." },
      { property: "og:title", content: "Mis clases de hoy — Escuela de Pádel" },
      { property: "og:description", content: "Vista de pista del profesor: clases del día y asistencia de un toque." },
    ],
  }),
  component: MyClasses,
});

function MyClasses() {
  const { data, markAttendance, coachId, userName, loading, isAdmin } = useStore();
  const today = todayKey();

  const classes = data.classes
    .filter((c) => (isAdmin ? true : c.coachId === coachId) && c.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  if (loading) return <p className="py-16 text-center text-sm text-muted-foreground">Cargando…</p>;

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={userName || "Profesor"} className="size-14 bg-primary text-lg text-primary-foreground" />
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Vista de pista</p>
          <h1 className="text-2xl font-bold">{userName || "Mis clases"}</h1>
          <p className="text-sm first-letter:uppercase text-muted-foreground">
            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      {classes.length === 0 ? (
        <EmptyState title="Hoy no tienes clases" description="Disfruta del descanso o revisa tus alumnos." />
      ) : (
        <div className="space-y-4">
          {classes.map((c) => {
            const students = c.studentIds
              .map((sid) => data.students.find((s) => s.id === sid))
              .filter((s): s is NonNullable<typeof s> => Boolean(s));
            const marked = Object.keys(c.attendance).length;
            const coach = data.coaches.find((x) => x.id === c.coachId);
            return (
              <section key={c.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <header className="flex items-center gap-3 border-b border-border bg-secondary/60 px-4 py-3">
                  <span className="font-display text-xl font-bold">{c.time}</span>
                  <span className="font-semibold">Pista {c.court}</span>
                  <LevelBadge category={c.level} />
                  <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3.5" /> {marked}/{students.length}
                  </span>
                </header>
                {students.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">Sin alumnos inscritos.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {students.map((s) => {
                      const state = c.attendance[s.id];
                      return (
                        <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                          <StudentAvatar name={s.name} photoPath={s.photoPath} />
                          <div className="min-w-0 flex-1">
                            <Link to="/alumnos/$id" params={{ id: s.id }} className="truncate font-medium hover:underline">
                              {s.name}
                            </Link>
                            <LevelBadge level={s.level} className="mt-1" />
                          </div>
                          <WhatsAppButton
                            iconOnly
                            variant="ghost"
                            className="size-10 rounded-full"
                            label={`Enviar recordatorio a ${s.name}`}
                            message={{
                              to: s.name,
                              phone: s.phone,
                              kind: "Recordatorio de clase",
                              body: classReminder(
                                s.name,
                                c.time,
                                c.court,
                                coach?.name ?? userName,
                                format(new Date(), "EEEE d 'de' MMMM", { locale: es }),
                              ),
                            }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                void markAttendance(c.id, s.id, true);
                                toast.success(`${s.name.split(" ")[0]} presente`);
                              }}
                              aria-label="Marcar presente"
                              className={cn(
                                "flex size-12 items-center justify-center rounded-xl border transition-colors",
                                state === true
                                  ? "border-success bg-success text-success-foreground"
                                  : "border-border bg-secondary text-muted-foreground hover:border-success/60 hover:text-success",
                              )}
                            >
                              <Check className="size-5" />
                            </button>
                            <button
                              onClick={() => void markAttendance(c.id, s.id, false)}
                              aria-label="Marcar ausente"
                              className={cn(
                                "flex size-12 items-center justify-center rounded-xl border transition-colors",
                                state === false
                                  ? "border-destructive bg-destructive text-destructive-foreground"
                                  : "border-border bg-secondary text-muted-foreground hover:border-destructive/60 hover:text-destructive",
                              )}
                            >
                              <X className="size-5" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <ClassWhiteboard session={c} students={students} />
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
