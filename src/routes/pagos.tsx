import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Clock3, Euro, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { StatCard, Avatar, EmptyState } from "@/components/padel-ui";
import { WhatsAppButton, paymentReminder } from "@/components/whatsapp-dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PLAN_LABELS, PLAN_PRICES, monthKey } from "@/lib/padel";

export const Route = createFileRoute("/pagos")({
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
      return { student: s, amount: p?.amount ?? PLAN_PRICES[s.plan], paid: s.paymentStatus === "pagado", paidAt: p?.paidAt };
    })
    .sort((a, b) => Number(a.paid) - Number(b.paid) || a.student.name.localeCompare(b.student.name));

  const collected = rows.filter((r) => r.paid).reduce((n, r) => n + r.amount, 0);
  const owed = rows.filter((r) => !r.paid).reduce((n, r) => n + r.amount, 0);
  const visible = rows.filter((r) => tab === "todos" || (tab === "pagado") === r.paid);

  return (
    <>
      <PageHeader title="Pagos" subtitle={hydrated ? `Mensualidad de ${format(new Date(), "MMMM yyyy", { locale: es })}` : undefined} />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Cobrado" value={`${collected} €`} icon={CheckCircle2} tone="primary" />
        <StatCard label="Pendiente" value={`${owed} €`} icon={Clock3} tone={owed ? "warning" : "default"} />
        <StatCard label="Previsto" value={`${collected + owed} €`} icon={Euro} />
      </div>

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
          {visible.map(({ student: s, amount, paid, paidAt }) => (
            <li key={s.id} className="flex items-center gap-3 p-3 md:p-4">
              <Avatar name={s.name} />
              <div className="min-w-0 flex-1">
                <Link to="/alumnos/$id" params={{ id: s.id }} className="truncate font-semibold hover:underline">
                  {s.name}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {PLAN_LABELS[s.plan]}
                  {paid && paidAt ? ` · pagado el ${format(new Date(paidAt), "d MMM", { locale: es })}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className={cn("font-display text-lg font-bold", paid ? "text-success" : "text-warning")}>{amount} €</p>
              </div>
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
                    setPaid(s.id, false);
                    toast("Pago revertido");
                  }}
                >
                  <RotateCcw />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setPaid(s.id, true);
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
