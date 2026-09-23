import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronRight, Clipboard, Clock, MessageCircleWarning, NotebookPen } from "lucide-react";
import { Avatar, EmptyState, LevelBadge } from "@/components/padel-ui";
import { StudentAvatar } from "@/components/student-avatar";
import { WhatsAppButton, classReminder, mediaReminder } from "@/components/whatsapp-dialog";
import { useStore } from "@/lib/store";
import { todayKey } from "@/lib/padel";

/** Pantalla de inicio del profesor: próximas clases, deberes pendientes y avisos de WhatsApp. */
export function CoachHome() {
  const { data, coachId, userName, loading } = useStore();
  const today = todayKey();

  if (loading) return <p className="py-16 text-center text-sm text-muted-foreground">Cargando…</p>;

  const myClasses = data.classes
    .filter((c) => c.coachId === coachId && c.date >= today)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

  const upcoming = myClasses.slice(0, 5);

  // Deberes pendientes: últimos materiales con comentarios/deberes para alumnos del profesor.
  const myStudentIds = new Set(myClasses.flatMap((c) => c.studentIds));
  const homework = data.media
    .filter((m) => m.comment.trim().length > 0 && myStudentIds.has(m.studentId))
    .slice(0, 5)
    .map((m) => ({ media: m, student: data.students.find((s) => s.id === m.studentId) }))
    .filter((x): x is { media: (typeof data.media)[number]; student: (typeof data.students)[number] } => Boolean(x.student));

  // Avisos de WhatsApp pendientes: alumnos de las clases de hoy sin asistencia marcada aún.
  const pendingNotices = myClasses
    .filter((c) => c.date === today)
    .flatMap((c) =>
      c.studentIds
        .filter((sid) => c.attendance[sid] === undefined)
        .map((sid) => ({ cls: c, student: data.students.find((s) => s.id === sid) }))
        .filter((x): x is { cls: (typeof myClasses)[number]; student: (typeof data.students)[number] } => Boolean(x.student)),
    );

  const dayLabel = (date: string) =>
    date === today ? "Hoy" : format(parseISO(date), "EEEE d 'de' MMMM", { locale: es });

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={userName || "Profesor"} className="size-14 bg-primary text-lg text-primary-foreground" />
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Inicio del profesor</p>
          <h1 className="text-2xl font-bold">Hola, {userName.split(" ")[0] || "profesor"}</h1>
          <p className="text-sm capitalize text-muted-foreground">
            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximas clases */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CalendarDays className="size-4 text-primary" /> Próximas clases
            </h2>
            <Link to="/mis-clases" className="flex items-center text-sm text-primary">
              Mis clases de hoy <ChevronRight className="size-4" />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState title="No tienes clases programadas" description="Cuando el administrador te asigne clases aparecerán aquí." />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((c) => (
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
                    <p className="mt-0.5 truncate text-sm capitalize text-muted-foreground">
                      {dayLabel(c.date)} · {c.studentIds.length}/4 alumnos
                    </p>
                  </div>
                  {c.date === today && (
                    <Link
                      to="/mis-clases"
                      className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                    >
                      Pasar lista
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Alumnos con deberes pendientes */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <NotebookPen className="size-4 text-primary" /> Deberes pendientes
            </h2>
            <Link to="/alumnos" className="flex items-center text-sm text-primary">
              Alumnos <ChevronRight className="size-4" />
            </Link>
          </div>
          {homework.length === 0 ? (
            <EmptyState title="Sin deberes pendientes" description="Los comentarios técnicos que dejes en los análisis aparecerán aquí." />
          ) : (
            <ul className="space-y-2">
              {homework.map(({ media, student }) => (
                <li key={media.id}>
                  <Link
                    to="/alumnos/$id"
                    params={{ id: student.id }}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-accent"
                  >
                    <StudentAvatar name={student.name} photoPath={student.photoPath} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{student.name}</p>
                      <p className="truncate text-sm text-primary">{media.title || "Análisis técnico"}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{media.comment}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Avisos de WhatsApp pendientes */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <MessageCircleWarning className="size-4 text-primary" /> Avisos de WhatsApp pendientes
            </h2>
          </div>
          {pendingNotices.length === 0 ? (
            <EmptyState title="Nada que avisar" description="Cuando tengas clases hoy, aquí verás los recordatorios por enviar." />
          ) : (
            <ul className="space-y-2">
              {pendingNotices.map(({ cls, student }) => (
                <li key={`${cls.id}-${student.id}`} className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-card p-3">
                  <StudentAvatar name={student.name} photoPath={student.photoPath} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Clase de hoy a las {cls.time} · Pista {cls.court}
                    </p>
                  </div>
                  <WhatsAppButton
                    iconOnly
                    variant="ghost"
                    className="size-10 shrink-0 rounded-full"
                    label={`Enviar recordatorio a ${student.name}`}
                    message={{
                      to: student.name,
                      phone: student.phone,
                      kind: "Recordatorio de clase",
                      body: classReminder(
                        student.name,
                        cls.time,
                        cls.court,
                        userName,
                        format(new Date(), "EEEE d 'de' MMMM", { locale: es }),
                      ),
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
          {homework.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Consejo: tras corregir un deber, envía el análisis por WhatsApp desde la ficha del alumno con «Notificar».
            </p>
          )}
        </section>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          to="/mis-clases"
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground"
        >
          <Clipboard className="size-5" /> Pasar lista de hoy
        </Link>
      </div>
    </>
  );
}

// Referencia para el mensaje de deberes disponible en whatsapp-dialog.
export { mediaReminder };
