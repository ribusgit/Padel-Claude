import { useState } from "react";
import { Settings2 } from "lucide-react";
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
import { PLAN_LABELS, type Plan } from "@/lib/padel";

const PLANS: Plan[] = ["1x", "2x", "particular"];
import { useStore } from "@/lib/store";

/** Ajustes del administrador: tarifas mensuales por plan y teléfono Bizum del club. */
export function FeeSettingsDialog() {
  const { data, setPlanFee, setBizumPhone } = useStore();
  const [open, setOpen] = useState(false);
  const [amounts, setAmounts] = useState<Record<Plan, string> | null>(null);
  const [bizum, setBizum] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentAmounts = amounts ?? {
    "1x": String(data.feePlans["1x"]),
    "2x": String(data.feePlans["2x"]),
    particular: String(data.feePlans.particular),
    prueba: "0",
  };
  const currentBizum = bizum ?? data.bizumPhone;

  const save = async () => {
    setSaving(true);
    try {
      for (const plan of PLANS) {
        const amount = Number(currentAmounts[plan]);
        if (!Number.isFinite(amount) || amount < 0) throw new Error("invalid");
        if (amount !== data.feePlans[plan]) await setPlanFee(plan, amount);
      }
      if (currentBizum.trim() !== data.bizumPhone) await setBizumPhone(currentBizum.trim());
      toast.success("Tarifas y Bizum actualizados");
      setOpen(false);
      setAmounts(null);
      setBizum(null);
    } catch {
      toast.error("Revisa los importes e inténtalo de nuevo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setAmounts(null); setBizum(null); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="size-4" /> Tarifas y Bizum
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Tarifas y Bizum</DialogTitle>
          <DialogDescription>
            Estas cuotas se aplican a los nuevos cobros y al pago con tarjeta de los alumnos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {PLANS.map((plan) => (
            <div key={plan} className="flex items-center gap-3">
              <Label className="flex-1 text-sm">{PLAN_LABELS[plan]}</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  step="1"
                  className="w-24 text-right"
                  value={currentAmounts[plan]}
                  onChange={(e) =>
                    setAmounts({ ...currentAmounts, [plan]: e.target.value })
                  }
                />
                <span className="text-sm text-muted-foreground">€</span>
              </div>
            </div>
          ))}
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="bizum-phone">Teléfono Bizum del club</Label>
            <Input
              id="bizum-phone"
              type="tel"
              placeholder="600 123 456"
              value={currentBizum}
              onChange={(e) => setBizum(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Se muestra a los alumnos y familias para pagar por Bizum.
            </p>
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
