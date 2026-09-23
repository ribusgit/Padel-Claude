import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Phone, Mail, CalendarCheck, Check, X, MessageSquarePlus, Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Student } from "@/lib/padel";
import { LevelBadge, PaymentBadge, EmptyState } from "@/components/padel-ui";
import { StudentAvatar, resizePhoto } from "@/components/student-avatar";
import { CameraCaptureDialog, PhotoSourceDialog } from "@/components/camera-capture-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentMedia } from "@/components/student-media";
import { StudentWhiteboard } from "@/components/student-whiteboard";
import { VideoSearch } from "@/components/video-search";
import { DeleteStudentButton } from "@/components/delete-student-button";
import { PayFeeButton } from "@/components/pay-fee-button";

import { ProgressSummary } from "@/components/progress-summary";
import { WhatsAppButton, generalReminder, paymentReminder } from "@/components/whatsapp-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LEVEL_OPTIONS, LEVEL_LABELS, PLAN_LABELS, PLAN_PRICES, formatLevel, levelCategory, todayKey } from "@/lib/padel";

export const Route = createFileRoute("/_authenticated/alumnos/$id")({
  head: () => ({
    meta: [
      { title: "Ficha de alumno — Escuela de Pádel" },
      { name: "description", content: "Datos, historial de asistencia y notas de progreso del alumno." },
      { property: "og:title", content: "Ficha de alumno — Escuela de Pádel" },
      { property: "og:description", content: "Datos, historial de asistencia y notas de progreso del alumno." },
    ],
  }),
  component: StudentDetail,
  notFoundComponent: () => <EmptyState title="Alumno no encontrado" />,
});

const fmt = (d: string) => format(parseISO(d), "d MMM yyyy", { locale: es });

function StudentDetail() {
  const { id } = Route.useParams();
  const { data, updateStudent, addNote, setPaid, isAdmin, coachId } = useStore();
  const student = data.students.find((s) => s.id === id);
  const [note, setNote] = useState("");
  const [noteCoachId, setNoteCoachId] = useState(coachId ?? data.coaches[0]?.id ?? "");

  if (!student) throw notFound();

  const attendance = [...student.attendance].sort((a, b) => b.date.localeCompare(a.date));
  const presentCount = attendance.filter((a) => a.present).length;
  const rate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;

  const saveNote = () => {
    if (note.trim().length < 3) {
      toast.error("Escribe una nota antes de guardar");
      return;
    }
    void addNote(student.id, { date: todayKey(), coachId: noteCoachId, text: note.trim().slice(0, 500) });
    setNote("");
    toast.success("Nota de progreso guardada");
  };

  return (
    <>
      <Link to="/alumnos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Alumnos
      </Link>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <StudentPhotoButton student={student} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <LevelBadge level={student.level} />
              <PaymentBadge status={student.paymentStatus} />
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            {student.paymentStatus === "pendiente" && (
              <PayFeeButton
                studentId={student.id}
                studentName={student.name}
                plan={student.plan}
                email={student.email}
              />
            )}
            <WhatsAppButton
              message={{
                to: student.name,
                phone: student.phone,
                kind: student.paymentStatus === "pendiente" ? "Recordatorio de pago" : "Recordatorio",
                body:
                  student.paymentStatus === "pendiente"
                    ? paymentReminder(student.name, PLAN_PRICES[student.plan], format(new Date(), "MMMM", { locale: es }))
                    : generalReminder(student.name),
              }}
              label="Notificar"
            />
            <DeleteStudentButton student={student} redirectToList />
          </div>

        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm md:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Teléfono</dt>
            <dd className="mt-0.5 flex items-center gap-1.5"><Phone className="size-3.5 text-primary" />{student.phone || "—"}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Correo</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 truncate"><Mail className="size-3.5 shrink-0 text-primary" /><span className="truncate">{student.email || "—"}</span></dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Inscripción</dt>
            <dd className="mt-0.5">{fmt(student.enrolledAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Tarifa</dt>
            <dd className="mt-0.5">{PLAN_LABELS[student.plan]}</dd>
          </div>
        </dl>

        {isAdmin && <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nivel de pádel</Label>
            <Select value={String(student.level)} onValueChange={(v) => void updateStudent(student.id, { level: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEVEL_OPTIONS.map((l) => (
                  <SelectItem key={l} value={String(l)}>{formatLevel(l)} · {LEVEL_LABELS[levelCategory(l)]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Pago del mes</Label>
            <Button
              variant={student.paymentStatus === "pagado" ? "secondary" : "default"}
              className="w-full"
              onClick={() => {
                const paid = student.paymentStatus !== "pagado";
                void setPaid(student.id, paid);
                toast.success(paid ? "Marcado como pagado" : "Marcado como pendiente");
              }}
            >
              {student.paymentStatus === "pagado" ? "Marcar como pendiente" : "Marcar como pagado"}
            </Button>
          </div>
        </div>}
      </div>

      <Tabs defaultValue="resumen" className="mt-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
          <TabsTrigger value="resumen">Seguimiento</TabsTrigger>
          <TabsTrigger value="multimedia">Análisis Multimedia</TabsTrigger>
          <TabsTrigger value="pizarra">Pizarra</TabsTrigger>
          <TabsTrigger value="contenidos">Vídeos de técnica</TabsTrigger>
        </TabsList>

        <TabsContent value="multimedia" className="mt-4">
          <StudentMedia student={student} />
        </TabsContent>

        <TabsContent value="pizarra" className="mt-4">
          <StudentWhiteboard student={student} />
        </TabsContent>

        <TabsContent value="contenidos" className="mt-4">
          <VideoSearch student={student} />
        </TabsContent>


        <TabsContent value="resumen" className="mt-4 space-y-6">
        <ProgressSummary studentId={student.id} studentName={student.name} />
        <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Historial de asistencia</h2>
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {rate}% asistencia
            </span>
          </div>
          {attendance.length === 0 ? (
            <EmptyState title="Sin asistencias registradas" />
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {attendance.map((a) => (
                <li key={a.classId + a.date} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full",
                      a.present ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
                    )}
                  >
                    {a.present ? <Check className="size-4" /> : <X className="size-4" />}
                  </span>
                  <span className="flex-1">{fmt(a.date)}</span>
                  <span className="text-muted-foreground">{a.present ? "Asistió" : "Faltó"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Notas de progreso</h2>
          <div className="rounded-2xl border border-border bg-card p-4">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Buen progreso en la bandeja, trabajar el globo defensivo…"
              maxLength={500}
              className="min-h-20"
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Select value={noteCoachId} onValueChange={setNoteCoachId}>
                <SelectTrigger className="sm:w-52"><SelectValue placeholder="Profesor" /></SelectTrigger>
                <SelectContent>
                  {data.coaches.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={saveNote} className="sm:ml-auto">
                <MessageSquarePlus /> Guardar nota
              </Button>
            </div>
          </div>
          {student.notes.length > 0 && (
            <ul className="mt-3 space-y-2">
              {student.notes.map((n) => {
                const coach = data.coaches.find((c) => c.id === n.coachId);
                return (
                  <li key={n.id} className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-sm leading-relaxed">{n.text}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarCheck className="size-3.5" /> {fmt(n.date)} · {coach?.name ?? "Profesor"}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

/** Avatar del alumno con botón para subir, cambiar o quitar la foto (solo administrador). */
function StudentPhotoButton({ student }: { student: Student }) {
  const { isAdmin, setStudentPhoto } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen");
      return;
    }
    setBusy(true);
    try {
      const resized = await resizePhoto(file);
      await setStudentPhoto(student.id, resized);
      toast.success("Foto actualizada");
    } catch {
      toast.error("No se pudo guardar la foto");
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    setBusy(true);
    try {
      await setStudentPhoto(student.id, null);
      toast.success("Foto eliminada");
    } catch {
      toast.error("No se pudo eliminar la foto");
    } finally {
      setBusy(false);
    }
  };

  if (!isAdmin) return <StudentAvatar name={student.name} photoPath={student.photoPath} className="size-14 text-lg" />;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setSourceOpen(true)}
        disabled={busy}
        className="group relative block cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={student.photoPath ? "Cambiar foto del alumno" : "Añadir foto del alumno"}
      >
        <StudentAvatar
          name={student.name}
          photoPath={student.photoPath}
          className={cn("size-14 text-lg", busy && "opacity-50")}
        />
        <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border border-border bg-primary text-primary-foreground shadow">
          <Camera className="size-3.5" />
        </span>
      </button>
      {student.photoPath && (
        <button
          type="button"
          onClick={() => void removePhoto()}
          disabled={busy}
          className="absolute -left-1 -top-1 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow hover:text-destructive"
          aria-label="Quitar foto"
        >
          <Trash2 className="size-3" />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <PhotoSourceDialog
        open={sourceOpen}
        onOpenChange={setSourceOpen}
        onPickFile={() => {
          setSourceOpen(false);
          inputRef.current?.click();
        }}
        onPickCamera={() => {
          setSourceOpen(false);
          setCameraOpen(true);
        }}
      />
      <CameraCaptureDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        title={`Foto de ${student.name}`}
        onCapture={(file) => onFile(file)}
      />
    </div>
  );
}
