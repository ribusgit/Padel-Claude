import { useEffect, useState, type ReactNode } from "react";
import { UserCog } from "lucide-react";
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
import { useStore } from "@/lib/store";
import type { Student } from "@/lib/padel";

/** El alumno edita sus propios datos: nombre, correo, teléfono y nivel. */
export function StudentProfileDialog({ student, trigger }: { student: Student; trigger: ReactNode }) {
  const { updateStudent } = useStore();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  const [phone, setPhone] = useState(student.phone);
  const [level, setLevel] = useState(String(student.level));

  useEffect(() => {
    if (open) {
      setName(student.name);
      setEmail(student.email);
      setPhone(student.phone);
      setLevel(String(student.level));
    }
  }, [open, student]);

  const save = async () => {
    if (!name.trim()) {
      toast.error("Escribe tu nombre");
      return;
    }
    const lvl = Number(level.replace(",", "."));
    if (!Number.isFinite(lvl) || lvl < 1 || lvl > 5) {
      toast.error("El nivel debe estar entre 1.0 y 5.0");
      return;
    }
    setSaving(true);
    try {
      await updateStudent(student.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        level: lvl,
      });
      toast.success("Datos actualizados");
      setOpen(false);
    } catch {
      toast.error("No se pudieron guardar tus datos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="size-4 text-primary" /> Mis datos
          </DialogTitle>
          <DialogDescription>Cambia tu nombre, correo, teléfono o nivel de juego.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="perfil-nombre">Nombre</Label>
            <Input id="perfil-nombre" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="perfil-correo">Correo</Label>
            <Input id="perfil-correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="perfil-telefono">Teléfono</Label>
            <Input id="perfil-telefono" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="perfil-nivel">Nivel (1.0 – 5.0)</Label>
            <Input
              id="perfil-nivel"
              type="number"
              step="0.5"
              min="1"
              max="5"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
