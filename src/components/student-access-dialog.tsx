import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Student } from "@/lib/padel";
import { createStudentAccount } from "@/lib/admin.functions";

/** Crea la cuenta de acceso del alumno a su portal (solo administrador). */
export function StudentAccessDialog({ student }: { student: Student }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(student.email);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!email.includes("@") || password.length < 8) {
      toast.error("Correo válido y contraseña de al menos 8 caracteres");
      return;
    }
    setSaving(true);
    try {
      await createStudentAccount({ data: { email: email.trim(), password, fullName: student.name, studentId: student.id } });
      toast.success(`Acceso creado para ${student.name}`);
      setOpen(false);
      setPassword("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear el acceso");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <KeyRound className="size-4" /> Crear acceso al portal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Acceso del alumno</DialogTitle>
          <DialogDescription>
            {student.name} podrá entrar con su correo y contraseña, ver sus cuotas pendientes y pagarlas con tarjeta o Bizum. No verá nada más de la escuela.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="sa-email">Correo del alumno</Label>
            <Input id="sa-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sa-pass">Contraseña temporal</Label>
            <Input id="sa-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => void create()} disabled={saving}>
            {saving ? "Creando…" : "Crear acceso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
