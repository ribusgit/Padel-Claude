import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Clock3, Euro, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { StatCard, EmptyState } from "@/components/padel-ui";
import { StudentAvatar } from "@/components/student-avatar";
import { WhatsAppButton, paymentReminder } from "@/components/whatsapp-dialog";
import { PayFeeButton } from "@/components/pay-fee-button";
import { BizumDialog } from "@/components/bizum-dialog";
import { FeeSettingsDialog } from "@/components/fee-settings-dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PLAN_LABELS, PAYMENT_METHOD_LABELS, monthKey } from "@/lib/padel";

export const Route = createFileRoute("/_authenticated/_admin/pagos")({
  head: () => ({
    meta: [
      { title: "Pagos y mensualidades — Escuela de Pádel" },
      { name: "description", content: "Control de cuotas del mes: quién ha pagado y quién tiene saldo pendiente." },
      { property: "og:title", content: "Pagos y mensualidades — Escuela de Pádel" },
      { property: "og:description", content: "Control de cuotas del mes: quién ha pagado y quién tiene saldo pendiente." },
    ],
  }),
  component: PaymentsPage,
});

type Tab = "todos" | "pendiente" | "pagado";

function PaymentsPage() {
  const { data, setPaid, hydrated } = useStore();
  const [tab, setTab] = useState<Tab>("todos");
  const month = monthKey();

  const rows = data.students
    .filter((s) => s.active)
    .map((s) => {
      const p = data.payments.find((x) => x.studentId === s.id && x.month === month);
      return { student: s, amount: p?.amount ?? data.feePlans[s.plan], paid: s.paymentStatus === "pagado", paidAt: p?.paidAt, method: p?.method };
    })
    .sort((a, b) => Number(a.paid) - Number(b.paid) || a.student.name.localeCompare(b.student.name));

  const collected = rows.filter((r) => r.paid).reduce((n, r) => n + r.amount, 0);
  const owed = rows.filter((r) => !r.paid).reduce((n, r) => n + r.amount, 0);
  const visible = rows.filter((r) => tab === "todos" || (tab === "pagado") === r.paid);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PageHeader title="Pagos" subtitle={hydrated ? `Mensualidad de ${format(new Date(), "MMMM yyyy", { locale: es })}` : undefined} />
        <FeeSettingsDialog />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Cobrado" value={`${collected} €`} icon={CheckCircle2} tone="primary" />
        <StatCard label="Pendiente" value={`${owed} €`} icon={Clock3} tone={owed ? "warning" : "default"} />
        <StatCard label="Previsto" value={`${collected + owed} €`} icon={Euro} />
      </div>

      {data.bizumPhone.trim() && rows.some((r) => !r.paid) ? (
        <section className="mt-5 rounded-2xl border border-primary/40 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold">Bizum por confirmar</h2>
              <p className="text-xs text-muted-foreground">
                Cuando recibas el Bizum en {data.bizumPhone}, confírmalo aquí y la deuda del alumno se actualiza al instante.
              </p>
            </div>
          </div>
          <ul className="mt-3 space-y-2">
            {rows.filter((r) => !r.paid).map(({ student: s, amount }) => (
              <li key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5">
                <StudentAvatar name={s.name} photoPath={s.photoPath} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{amount} € · {PLAN_LABELS[s.plan]}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    void setPaid(s.id, true, "bizum");
                    toast.success(`Bizum de ${s.name} confirmado`);
                  }}
                >
                  Confirmar Bizum
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}



      <div className="mt-5 flex gap-1.5">
        {(["todos", "pendiente", "pagado"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize transition-colors",
              tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent",
            )}
          >
            {t === "todos" ? "Todos" : t === "pendiente" ? "Deudores" : "Pagados"}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="mt-4"><EmptyState title="Nada que mostrar" /></div>
      ) : (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {visible.map(({ student: s, amount, paid, paidAt, method }) => (
            <li key={s.id} className="flex items-center gap-3 p-3 md:p-4">
              <StudentAvatar name={s.name} photoPath={s.photoPath} />
              <div className="min-w-0 flex-1">
                <Link to="/alumnos/$id" params={{ id: s.id }} className="truncate font-semibold hover:underline">
                  {s.name}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {PLAN_LABELS[s.plan]}
                  {paid && paidAt ? ` · pagado el ${format(new Date(paidAt), "d MMM", { locale: es })}` : ""}
                  {paid && method ? ` · ${PAYMENT_METHOD_LABELS[method]}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className={cn("font-display text-lg font-bold", paid ? "text-success" : "text-warning")}>{amount} €</p>
              </div>
              {!paid && <PayFeeButton iconOnly studentId={s.id} studentName={s.name} plan={s.plan} email={s.email} />}
              {!paid && <BizumDialog canConfirm studentId={s.id} studentName={s.name} amount={amount} />}
              {!paid && (
                <WhatsAppButton
                  iconOnly
                  label={`Enviar recordatorio de pago a ${s.name}`}
                  message={{
                    to: s.name,
                    phone: s.phone,
                    kind: "Recordatorio de pago",
                    body: paymentReminder(s.name, amount, format(new Date(), "MMMM", { locale: es })),
                  }}
                />
              )}
              {paid ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Deshacer pago"
                  onClick={() => {
                    void setPaid(s.id, false);
                    toast("Pago revertido");
                  }}
                >
                  <RotateCcw />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    void setPaid(s.id, true);
                    toast.success(`${s.name} marcado como pagado`);
                  }}
                >
                  Pagado
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
