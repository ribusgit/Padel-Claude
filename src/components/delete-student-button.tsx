import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import type { Student } from "@/lib/padel";

type Props = {
  student: Student;
  /** Si es true, al borrar se navega a la lista de alumnos. */
  redirectToList?: boolean;
  variant?: "icon" | "button";
};

export function DeleteStudentButton({ student, redirectToList = false, variant = "icon" }: Props) {
  const { deleteStudent, isAdmin } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isAdmin) return null;

  const confirm = async () => {
    setBusy(true);
    try {
      await deleteStudent(student.id);
      toast.success(`${student.name} eliminado de la escuela`);
      setOpen(false);
      if (redirectToList) void navigate({ to: "/alumnos" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el alumno");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Eliminar a ${student.name}`}
          className="text-muted-foreground hover:text-destructive"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen(true);
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      ) : (
        <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
          <Trash2 className="size-4" />
          Eliminar alumno
        </Button>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {student.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán sus datos, asistencia, notas de progreso, resúmenes, pagos y archivos multimedia, y
              se quitará de las clases donde estuviera inscrito. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void confirm();
              }}
            >
              {busy ? "Eliminando…" : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
