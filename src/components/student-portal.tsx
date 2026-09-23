import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Clock3, Wallet } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { StatCard, EmptyState, LevelBadge } from "@/components/padel-ui";
import { StudentAvatar } from "@/components/student-avatar";
import { PayFeeButton } from "@/components/pay-fee-button";
import { BizumDialog } from "@/components/bizum-dialog";
import { useStore } from "@/lib/store";
import { PLAN_LABELS, levelCategory, monthKey } from "@/lib/padel";

const MONTHS_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const monthLabel = (m: string) => {
  const [y, mm] = m.split("-").map(Number);
  return `${MONTHS_ES[(mm ?? 1) - 1]} ${y}`;
};

/** Portal privado del alumno: ve su cuota y paga lo que debe, sin acceso a la gestión. */
export function StudentPortal() {
  const { data, studentId, userName } = useStore();
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
  const currentFee = data.feePlans[student.plan];
  const totalDebt = pending.length * currentFee;
  const currentFee = data.feePlans[student.plan];

  return (
    <>
      <PageHeader title={`Hola, ${student.name.split(" ")[0] ?? userName}`} subtitle="Tu portal de alumno" />

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <StudentAvatar name={student.name} photoPath={student.photoPath} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{student.name}</p>
          <p className="text-xs text-muted-foreground">
            {PLAN_LABELS[student.plan]} · {currentFee} €/mes
          </p>
        </div>
        <LevelBadge level={student.level} category={levelCategory(student.level)} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard label="Cuota mensual" value={`${currentFee} €`} icon={Wallet} tone="primary" />
        <StatCard
          label="Pendiente"
          value={`${totalDebt} €`}
          icon={Clock3}
          tone={totalDebt > 0 ? "warning" : "default"}
          hint={totalDebt > 0 ? `${pending.length} ${pending.length === 1 ? "cuota" : "cuotas"}` : "todo al día"}
        />
      </div>

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold">Cuotas pendientes</h2>
        {pending.length === 0 ? (
          <div className="mt-3"><EmptyState title="No debes nada" description="Todas tus cuotas están pagadas. ¡Buen trabajo!" /></div>
        ) : (
          <ul className="mt-3 space-y-3">
            {pending.map((p) => (
              <li key={p.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold capitalize">Cuota de {monthLabel(p.month)}</p>
                    <p className="font-display text-xl font-bold text-warning">{currentFee} €</p>
                  </div>
                  <div className="flex flex-col items-stretch gap-2 sm:flex-row">
                    <PayFeeButton studentId={student.id} studentName={student.name} plan={student.plan} email={student.email} month={p.month} />
                    <BizumDialog studentId={student.id} studentName={student.name} amount={currentFee} month={p.month} />
                  </div>
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
