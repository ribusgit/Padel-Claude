import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { LEVEL_LABELS, PLAN_LABELS, PLAN_PRICES, levelCategory, type Student } from "@/lib/padel";

const euro = (n: number) => Number(n.toFixed(2));

/** Exporta el listado de alumnos, sus pagos y la situación global a un archivo Excel. */
export function ExportStudentsButton() {
  const { data } = useStore();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const XLSX = await import("xlsx");
      const students = [...data.students].sort((a, b) => a.name.localeCompare(b.name));
      const paymentsOf = (s: Student) => data.payments.filter((p) => p.studentId === s.id);

      const alumnos = students.map((s) => {
        const pays = paymentsOf(s);
        const debt = pays.filter((p) => !p.paid).reduce((t, p) => t + p.amount, 0);
        const asistencias = s.attendance.length;
        const presentes = s.attendance.filter((a) => a.present).length;
        return {
          Nombre: s.name,
          Teléfono: s.phone,
          Correo: s.email,
          "Fecha de inscripción": format(parseISO(s.enrolledAt), "dd/MM/yyyy"),
          Nivel: s.level.toFixed(1),
          Categoría: LEVEL_LABELS[levelCategory(s.level)],
          Tarifa: PLAN_LABELS[s.plan],
          "Cuota mensual (€)": euro(PLAN_PRICES[s.plan]),
          "Estado de pago": s.paymentStatus === "pagado" ? "Pagado" : "Pendiente",
          "Deuda acumulada (€)": euro(debt),
          "Meses registrados": pays.length,
          "Meses pagados": pays.filter((p) => p.paid).length,
          "Asistencia (%)": asistencias ? Math.round((presentes / asistencias) * 100) : "",
          "Clases registradas": asistencias,
          Estado: s.active ? "Activo" : "Inactivo",
        };
      });

      const pagos = [...data.payments]
        .sort((a, b) => b.month.localeCompare(a.month))
        .map((p) => {
          const s = data.students.find((st) => st.id === p.studentId);
          return {
            Alumno: s?.name ?? "—",
            Mes: p.month,
            "Importe (€)": euro(p.amount),
            Situación: p.paid ? "Pagado" : "Pendiente",
            "Fecha de cobro": p.paidAt ? format(parseISO(p.paidAt), "dd/MM/yyyy") : "",
            Tarifa: s ? PLAN_LABELS[s.plan] : "",
            Teléfono: s?.phone ?? "",
          };
        });

      const cobrado = data.payments.filter((p) => p.paid).reduce((t, p) => t + p.amount, 0);
      const pendiente = data.payments.filter((p) => !p.paid).reduce((t, p) => t + p.amount, 0);
      const resumen = [
        { Concepto: "Fecha del informe", Valor: format(new Date(), "dd/MM/yyyy HH:mm", { locale: es }) },
        { Concepto: "Alumnos activos", Valor: data.students.filter((s) => s.active).length },
        { Concepto: "Alumnos inactivos", Valor: data.students.filter((s) => !s.active).length },
        { Concepto: "Alumnos al día de pago", Valor: data.students.filter((s) => s.paymentStatus === "pagado").length },
        { Concepto: "Alumnos con pago pendiente", Valor: data.students.filter((s) => s.paymentStatus === "pendiente").length },
        { Concepto: "Iniciación", Valor: data.students.filter((s) => levelCategory(s.level) === "iniciacion").length },
        { Concepto: "Intermedio", Valor: data.students.filter((s) => levelCategory(s.level) === "intermedio").length },
        { Concepto: "Avanzado", Valor: data.students.filter((s) => levelCategory(s.level) === "avanzado").length },
        { Concepto: "Total cobrado (€)", Valor: euro(cobrado) },
        { Concepto: "Total pendiente de cobro (€)", Valor: euro(pendiente) },
      ];

      const book = XLSX.utils.book_new();
      const sheets: Array<[string, object[], number[]]> = [
        ["Resumen", resumen, [34, 24]],
        ["Alumnos", alumnos, [26, 14, 26, 18, 8, 13, 18, 16, 15, 18, 16, 14, 14, 16, 10]],
        ["Pagos", pagos, [26, 10, 12, 13, 15, 18, 14]],
      ];
      for (const [name, rows, widths] of sheets) {
        const sheet = XLSX.utils.json_to_sheet(rows);
        sheet["!cols"] = widths.map((w) => ({ wch: w }));
        XLSX.utils.book_append_sheet(book, sheet, name);
      }

      XLSX.writeFile(book, `alumnos-escuela-padel-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Excel descargado");
    } catch {
      toast.error("No se ha podido generar el Excel");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="secondary" disabled={busy} onClick={() => void run()}>
      <FileSpreadsheet /> {busy ? "Generando…" : "Exportar a Excel"}
    </Button>
  );
}
