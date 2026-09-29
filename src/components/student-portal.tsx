import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, ChevronDown, Clock3, Dumbbell, Sparkles, UserCog, Wallet } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { StatCard, EmptyState, LevelBadge } from "@/components/padel-ui";
import { StudentAvatar } from "@/components/student-avatar";
import { StudentProfileDialog } from "@/components/student-profile-dialog";
import { PayFeeButton } from "@/components/pay-fee-button";
import { BizumDialog } from "@/components/bizum-dialog";
import { useStore } from "@/lib/store";
import { WhatsAppButton } from "@/components/whatsapp-dialog";

import { useExercises } from "@/lib/exercises";
import { PLAN_LABELS, classEndTime, hhmm, isTechniqueReport, levelCategory, todayKey } from "@/lib/padel";

const MONTHS_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const monthLabel = (m: string) => {
  const [y, mm] = m.split("-").map(Number);
  return `${MONTHS_ES[(mm ?? 1) - 1]} ${y}`;
};

/** Portal privado del alumno: ve su cuota, paga lo que debe y consulta su informe de técnica. */
export function StudentPortal() {
  const { data, studentId, userName } = useStore();
  const [reportOpen, setReportOpen] = useState(false);
  const { byLevel } = useExercises();
  const student = data.students.find((s) => s.id === studentId);

  if (!student) {
    return (
      <EmptyState
        title="Tu cuenta aún no está vinculada a una ficha"
        description="Pide al administrador de la escuela que vincule tu cuenta con tu ficha de alumno."
      />
    );
  }

  const myPayments = data.payments
    .filter((p) => p.studentId === student.id)
    .sort((a, b) => b.month.localeCompare(a.month));
  const pending = myPayments.filter((p) => !p.paid);
  const paidHistory = myPayments.filter((p) => p.paid);
  // Las tarifas son solo para administradores; el alumno ve el importe de sus propias cuotas.
  const currentFee = myPayments[0]?.amount ?? 0;
  const totalDebt = pending.reduce((sum, p) => sum + p.amount, 0);

  const latestReport = data.media
    .filter((m) => m.studentId === student.id && isTechniqueReport(m.comment))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  // Próximas clases del alumno con el ejercicio que toca, según las clases ya hechas de ese nivel.
  const upcoming = data.classes
    .filter((c) => c.studentIds.includes(student.id) && c.date >= todayKey())
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 4)
    .map((c) => {
      const bank = byLevel(c.level);
      const done = data.classes.filter(
        (x) => x.level === c.level && x.studentIds.includes(student.id) && (x.date < c.date || (x.date === c.date && x.time < c.time)),
      ).length;
      return { cls: c, exercise: bank[done % bank.length]! };
    });

  const myCalendar = Object.entries(
    data.classes
      .filter((c) => c.studentIds.includes(student.id) && c.date >= todayKey())
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .reduce<Record<string, typeof data.classes>>((acc, c) => ((acc[c.date] ??= []).push(c), acc), {}),
  ).slice(0, 14);

  return (
    <>
      <PageHeader title={`Hola, ${student.name.split(" ")[0] ?? userName}`} subtitle="Tu portal de alumno" />

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <StudentAvatar name={student.name} photoPath={student.photoPath} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{student.name}</p>
            <p className="text-xs text-muted-foreground">
              {PLAN_LABELS[student.plan]}{currentFee > 0 ? ` · ${currentFee} €/mes` : ""}
            </p>
          </div>
          <LevelBadge level={student.level} category={levelCategory(student.level)} />
        </div>
        <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Nombre</dt>
            <dd className="truncate font-medium">{student.name}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Correo</dt>
            <dd className="truncate font-medium">{student.email || "—"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Teléfono</dt>
            <dd className="truncate font-medium">{student.phone || "—"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Nivel</dt>
            <dd className="font-medium">{student.level.toFixed(1)}</dd>
          </div>
        </dl>
        <StudentProfileDialog
          student={student}
          trigger={
            <Button variant="outline" className="mt-3 h-11 w-full">
              <UserCog className="size-4" /> Cambiar mis datos
            </Button>
          }
        />
      </section>


      {upcoming[0] && (() => {
        const next = upcoming[0].cls;
        const coach = data.coaches.find((x) => x.id === next.coachId);
        const when = next.date === todayKey() ? "Hoy" : format(parseISO(next.date), "EEEE d 'de' MMMM", { locale: es });
        return (
          <div role="status" className="mt-4 flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4">
            <Clock3 className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Tu próxima clase</p>
              <p className="font-semibold first-letter:uppercase">{when} · {next.time} · Pista {next.court}</p>
              {coach && <p className="text-xs text-muted-foreground">Con {coach.name}</p>}
            </div>
            {coach?.phone && (
              <WhatsAppButton
                label="Avisar al profesor"
                message={{
                  to: coach.name,
                  phone: coach.phone,
                  kind: "Aviso del alumno",
                  body: `Hola ${coach.name.split(" ")[0]}, soy ${student.name}. Sobre la clase de ${when.toLowerCase()} a las ${next.time} (Pista ${next.court}): `,
                }}
              />
            )}
          </div>
        );
      })()}

      {upcoming.length > 0 && (
        <section className="mt-4">
          <h2 className="font-display text-lg font-semibold">Tus próximas clases y ejercicios</h2>
          <ul className="mt-3 space-y-2">
            {upcoming.map(({ cls, exercise }) => (
              <li key={cls.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Dumbbell className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{exercise.title}</p>
                  {exercise.description && <p className="text-xs text-muted-foreground">{exercise.description}</p>}
                  {exercise.videoUrl && <a href={exercise.videoUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary">Ver vídeo</a>}
                  <p className="text-xs capitalize text-muted-foreground">
                    {format(parseISO(cls.date), "EEEE d 'de' MMMM", { locale: es })} · {hhmm(cls.time)} · Pista {cls.court}
                  </p>
                </div>
                <LevelBadge category={cls.level} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold">Mi calendario</h2>
        {myCalendar.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aún no tienes clases programadas.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {myCalendar.map(([date, list]) => (
              <div key={date} className="rounded-2xl border border-border bg-card p-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary first-letter:uppercase">
                  {format(parseISO(date), "EEEE d 'de' MMMM", { locale: es })}
                </p>
                <ul className="mt-2 space-y-2">
                  {list.map((c) => {
                    const coach = data.coaches.find((x) => x.id === c.coachId);
                    return (
                      <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">
                            {hhmm(c.time)}–{classEndTime(c.time, c.durationMin)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            Pista {c.court}{coach ? ` · ${coach.name}` : ""}
                          </p>
                        </div>
                        {coach?.phone && (
                          <WhatsAppButton
                            iconOnly
                            variant="ghost"
                            label={`Avisar a ${coach.name}`}
                            message={{
                              to: coach.name,
                              phone: coach.phone,
                              kind: "Aviso del alumno",
                              body: `Hola ${coach.name.split(" ")[0]}, soy ${student.name}. Sobre la clase del ${format(parseISO(c.date), "d 'de' MMMM", { locale: es })} a las ${hhmm(c.time)} (Pista ${c.court}): `,
                            }}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>

              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard label="Cuota mensual" value={currentFee > 0 ? `${currentFee} €` : "—"} icon={Wallet} tone="primary" />
        <StatCard
          label="Pendiente"
          value={`${totalDebt} €`}
          icon={Clock3}
          tone={totalDebt > 0 ? "warning" : "default"}
          hint={totalDebt > 0 ? `${pending.length} ${pending.length === 1 ? "cuota" : "cuotas"}` : "todo al día"}
        />
      </div>

      {latestReport && (
        <section className="mt-6">
          <h2 className="font-display text-lg font-semibold">Tu último informe de técnica</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-primary/30 bg-card">
            <button
              type="button"
              onClick={() => setReportOpen((v) => !v)}
              aria-expanded={reportOpen}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{latestReport.title}</span>
                <span className="block text-xs capitalize text-muted-foreground">
                  {format(parseISO(latestReport.createdAt), "d 'de' MMMM yyyy", { locale: es })}
                </span>
              </span>
              <ChevronDown className={`size-5 shrink-0 text-muted-foreground transition-transform ${reportOpen ? "rotate-180" : ""}`} />
            </button>
            {reportOpen && (
              <p className="whitespace-pre-line border-t border-border p-4 text-sm leading-relaxed text-muted-foreground">
                {latestReport.comment}
              </p>
            )}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold">Cuotas pendientes</h2>
        {pending.length === 0 ? (
          <div className="mt-3"><EmptyState title="No debes nada" description="Todas tus cuotas están pagadas. ¡Buen trabajo!" /></div>
        ) : (
          <ul className="mt-3 space-y-3">
            {pending.map((p) => (
              <li key={p.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold capitalize">Cuota de {monthLabel(p.month)}</p>
                  <p className="font-display text-2xl font-bold text-warning">{p.amount} €</p>
                </div>
                <div className="mt-3 grid gap-2">
                  <PayFeeButton studentId={student.id} studentName={student.name} plan={student.plan} email={student.email} month={p.month} amount={p.amount} className="h-11 w-full text-base" />
                  <BizumDialog studentId={student.id} studentName={student.name} amount={p.amount} month={p.month} triggerClassName="h-11 w-full text-base" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold">Historial de pagos</h2>
        {paidHistory.length === 0 ? (
          <div className="mt-3"><EmptyState title="Sin pagos todavía" /></div>
        ) : (
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {paidHistory.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3.5">
                <CheckCircle2 className="size-5 shrink-0 text-success" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium capitalize">{monthLabel(p.month)}</p>
                  {p.paidAt && (
                    <p className="text-xs text-muted-foreground">
                      Pagado el {format(parseISO(p.paidAt), "d 'de' MMMM yyyy", { locale: es })}
                    </p>
                  )}
                </div>
                <p className="font-display font-bold text-success">{p.amount} €</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
