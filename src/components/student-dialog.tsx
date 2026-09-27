import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import {
  LEVEL_OPTIONS,
  LEVEL_LABELS,
  PLAN_LABELS,
  formatLevel,
  levelCategory,
  todayKey,
  type Plan,
  type PaymentStatus,
} from "@/lib/padel";

export function StudentDialog({ trigger, onCreated }: { trigger: ReactNode; onCreated?: (id: string) => void }) {
  const { addStudent } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("2");
  const [plan, setPlan] = useState<Plan>("1x");
  const [payment, setPayment] = useState<PaymentStatus>("pendiente");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Introduce el nombre completo del alumno");
      return;
    }
    const s = await addStudent({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      enrolledAt: todayKey(),
      level: Number(level),
      plan,
      paymentStatus: payment,
    });
    toast.success(`${s.name} añadido a la escuela`);
    setOpen(false);
    setName("");
    setPhone("");
    setEmail("");
    onCreated?.(s.id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo alumno</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana García" maxLength={80} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="600 000 000" maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ana@mail.com" maxLength={120} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Nivel de pádel</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEVEL_OPTIONS.map((l) => (
                  <SelectItem key={l} value={String(l)}>
                    {formatLevel(l)} · {LEVEL_LABELS[levelCategory(l)]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tarifa</Label>
              <Select value={plan} onValueChange={(v) => { setPlan(v as Plan); if (v === "prueba") setPayment("pagado"); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PLAN_LABELS) as Plan[]).map((p) => (
                    <SelectItem key={p} value={p}>{PLAN_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {plan === "prueba" ? (
              <p className="self-end rounded-md bg-primary/10 p-2 text-xs text-primary">Sin coste: no genera cuota.</p>
            ) : <div className="space-y-1.5">
              <Label>Pago del mes</Label>
              <Select value={payment} onValueChange={(v) => setPayment(v as PaymentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>}
          </div>
          <Button type="submit" className="w-full" size="lg">Guardar alumno</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
