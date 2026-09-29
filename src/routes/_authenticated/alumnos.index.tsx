import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, UserPlus, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { LevelBadge, PaymentBadge, EmptyState } from "@/components/padel-ui";
import { StudentAvatar } from "@/components/student-avatar";
import { WhatsAppButton, generalReminder, paymentReminder } from "@/components/whatsapp-dialog";
import { StudentDialog } from "@/components/student-dialog";
import { DeleteStudentButton } from "@/components/delete-student-button";
import { PayFeeButton } from "@/components/pay-fee-button";
import { ExportStudentsButton } from "@/components/export-students-button";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LEVEL_LABELS, PLAN_LABELS, PLAN_PRICES, levelCategory, todayKey, type LevelCategory } from "@/lib/padel";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/alumnos/")({
  head: () => ({
    meta: [
      { title: "Alumnos — Padel Time" },
      { name: "description", content: "Base de datos de alumnos con nivel, tarifa, estado de pago y progreso." },
      { property: "og:title", content: "Alumnos — Padel Time" },
      { property: "og:description", content: "Base de datos de alumnos con nivel, tarifa, estado de pago y progreso." },
    ],
  }),
  component: StudentsPage,
});

type Filter = "todos" | LevelCategory;

function StudentsPage() {
  const { data, isAdmin } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.students
      .filter((s) => s.active)
      .filter((s) => filter === "todos" || levelCategory(s.level) === filter)
      .filter((s) => !term || s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term) || s.phone.includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.students, q, filter]);

  // Próxima clase de cada alumno y quién aún no tiene ninguna (ni pasada ni futura).
  const { nextClass, notStarted } = useMemo(() => {
    const today = todayKey();
    const next = new Map<string, { date: string; time: string; court: number }>();
    const hasAny = new Set<string>();
    for (const c of data.classes) {
      for (const sid of c.studentIds) {
        hasAny.add(sid);
        if (c.date >= today) {
          const cur = next.get(sid);
          if (!cur || (c.date + c.time) < (cur.date + cur.time)) next.set(sid, { date: c.date, time: c.time, court: c.court });
        }
      }
    }
    return {
      nextClass: next,
      notStarted: data.students.filter((s) => s.active && !hasAny.has(s.id)).sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [data.classes, data.students]);

  return (
    <>
      <PageHeader
        title="Alumnos"
        subtitle={`${data.students.filter((s) => s.active).length} alumnos activos`}
        action={
          isAdmin ? (
            <div className="flex flex-wrap gap-2">
              <ExportStudentsButton />
              <StudentDialog
                trigger={
                  <Button>
                    <UserPlus /> Nuevo alumno
                  </Button>
                }
              />
            </div>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, correo o teléfono" className="h-11 pl-9" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {(["todos", "iniciacion", "intermedio", "avanzado"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent",
              )}
            >
              {f === "todos" ? "Todos" : LEVEL_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState title="Sin resultados" description="Prueba con otro filtro o búsqueda." />
      ) : (
        <ul className="space-y-2">
          {list.map((s) => (
            <li key={s.id} className="relative">
              <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center gap-0.5 md:right-10">
                {s.paymentStatus === "pendiente" && (
                  <PayFeeButton iconOnly studentId={s.id} studentName={s.name} plan={s.plan} email={s.email} />
                )}
                <WhatsAppButton
                  iconOnly
                  label={`Enviar recordatorio a ${s.name}`}
                  message={{
                    to: s.name,
                    phone: s.phone,
                    kind: s.paymentStatus === "pendiente" ? "Recordatorio de pago" : "Recordatorio",
                    body:
                      s.paymentStatus === "pendiente"
                        ? paymentReminder(s.name, data.feePlans[s.plan], format(new Date(), "MMMM", { locale: es }))
                        : generalReminder(s.name),
                  }}
                />
                <DeleteStudentButton student={s} />
              </div>

              <Link
                to="/alumnos/$id"
                params={{ id: s.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-accent md:p-4"
              >
                <StudentAvatar name={s.name} photoPath={s.photoPath} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {PLAN_LABELS[s.plan]} · {s.phone}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 sm:hidden">
                    <LevelBadge level={s.level} />
                    <PaymentBadge status={s.paymentStatus} />
                  </div>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <LevelBadge level={s.level} />
                  <PaymentBadge status={s.paymentStatus} />
                </div>
                <span
                  className={cn(
                    "shrink-0",
                    s.paymentStatus === "pendiente"
                      ? isAdmin
                        ? "w-[7rem]"
                        : "w-[4.75rem]"
                      : isAdmin
                        ? "w-[4.75rem]"
                        : "w-9",
                  )}
                />
                <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground md:block" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
