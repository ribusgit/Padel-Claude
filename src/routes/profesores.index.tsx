import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, ChevronRight, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Avatar } from "@/components/padel-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { todayKey } from "@/lib/padel";

export const Route = createFileRoute("/profesores/")({
  head: () => ({
    meta: [
      { title: "Profesores — Escuela de Pádel" },
      { name: "description", content: "Registro de profesores y acceso a la vista de pista para pasar lista." },
      { property: "og:title", content: "Profesores — Escuela de Pádel" },
      { property: "og:description", content: "Registro de profesores y acceso a la vista de pista para pasar lista." },
    ],
  }),
  component: CoachesPage,
});

function CoachesPage() {
  const { data, addCoach } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const today = todayKey();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error("Introduce el nombre del profesor");
    addCoach({ name: name.trim(), phone: phone.trim(), email: email.trim(), specialty: specialty.trim() });
    toast.success("Profesor registrado");
    setOpen(false);
    setName(""); setPhone(""); setEmail(""); setSpecialty("");
  };

  return (
    <>
      <PageHeader
        title="Profesores"
        subtitle="Cada profesor tiene su vista de pista para pasar lista"
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
            <li key={c.id}>
              <Link
                to="/profesores/$id"
                params={{ id: c.id }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent"
              >
                <Avatar name={c.name} className="size-12 bg-primary/15 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.specialty || "Profesor"} · {c.phone}</p>
                  <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
                    <CalendarDays className="size-3" /> {n} {n === 1 ? "clase" : "clases"} hoy
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
