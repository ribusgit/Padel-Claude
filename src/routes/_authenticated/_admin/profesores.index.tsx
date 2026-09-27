import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { UserPlus, ChevronRight, CalendarDays, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Avatar } from "@/components/padel-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { createCoachAccount } from "@/lib/admin.functions";
import { todayKey, type Coach } from "@/lib/padel";

export const Route = createFileRoute("/_authenticated/_admin/profesores/")({
  head: () => ({
    meta: [
      { title: "Profesores — Escuela de Pádel" },
      { name: "description", content: "Registro de profesores y creación de sus accesos a la aplicación." },
      { property: "og:title", content: "Profesores — Escuela de Pádel" },
      { property: "og:description", content: "Registro de profesores y creación de sus accesos a la aplicación." },
    ],
  }),
  component: CoachesPage,
});

function AccountDialog({ coach }: { coach: Coach }) {
  const createAccount = useServerFn(createCoachAccount);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(coach.email);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createAccount({ data: { email: email.trim(), password, fullName: coach.name, coachId: coach.id } });
      toast.success(`Acceso creado para ${coach.name}`);
      setOpen(false);
      setPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el acceso");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" onClick={(e) => e.stopPropagation()}>
          <KeyRound /> Crear acceso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Acceso de {coach.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="acc-email">Correo del profesor</Label>
            <Input id="acc-email" type="email" className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-pass">Contraseña provisional</Label>
            <Input
              id="acc-pass"
              type="text"
              className="h-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Comparte estos datos con el profesor. Solo verá sus clases del día y las fichas de sus alumnos.
          </p>
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? "Creando…" : "Crear acceso"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CoachesPage() {
  const { data, addCoach, deleteCoach } = useStore();
  const [deleting, setDeleting] = useState<string | null>(null);

  const removeCoach = async (c: Coach) => {
    if (!window.confirm(`¿Eliminar a ${c.name}? Sus clases quedarán sin profesor asignado.`)) return;
    setDeleting(c.id);
    try {
      await deleteCoach(c.id);
      toast.success("Profesor eliminado");
    } catch {
      toast.error("No se pudo eliminar el profesor");
    } finally {
      setDeleting(null);
    }
  };
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const today = todayKey();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Introduce el nombre del profesor");
      return;
    }
    void addCoach({ name: name.trim(), phone: phone.trim(), email: email.trim(), specialty: specialty.trim() });
    toast.success("Profesor registrado");
    setOpen(false);
    setName("");
    setPhone("");
    setEmail("");
    setSpecialty("");
  };

  return (
    <>
      <PageHeader
        title="Profesores"
        subtitle="Crea su acceso para que pasen lista desde la pista"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus /> Nuevo profesor</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Registrar profesor</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cname">Nombre completo</Label>
                  <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cphone">Teléfono</Label>
                    <Input id="cphone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cemail">Correo</Label>
                    <Input id="cemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cspec">Especialidad</Label>
                  <Input id="cspec" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Iniciación, competición…" maxLength={80} />
                </div>
                <Button type="submit" className="w-full" size="lg">Guardar profesor</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <ul className="grid gap-3 sm:grid-cols-2">
        {data.coaches.map((c) => {
          const n = data.classes.filter((k) => k.coachId === c.id && k.date === today).length;
          return (
            <li key={c.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-4">
                <Avatar name={c.name} className="size-12 bg-primary/15 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.specialty || "Profesor"} · {c.phone}</p>
                  <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
                    <CalendarDays className="size-3" /> {n} {n === 1 ? "clase" : "clases"} hoy
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  to="/profesores/$id"
                  params={{ id: c.id }}
                  className="inline-flex items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Ver sus clases <ChevronRight className="size-4" />
                </Link>
                <AccountDialog coach={c} />
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={deleting === c.id}
                  onClick={() => void removeCoach(c)}
                >
                  <Trash2 /> {deleting === c.id ? "Eliminando…" : "Eliminar"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
