import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Package, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
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
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { MATERIAL_CATEGORY_LABELS, monthKey, todayKey, type MaterialCategory } from "@/lib/padel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_admin/material")({
  head: () => ({
    meta: [
      { title: "Material y presupuesto · Escuela de Pádel" },
      {
        name: "description",
        content: "Inventario de material de la escuela de pádel y control del presupuesto mensual de gasto.",
      },
      { property: "og:title", content: "Material y presupuesto · Escuela de Pádel" },
      { property: "og:description", content: "Controla el material comprado y cuánto queda del presupuesto del mes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MaterialPage,
});

const eur = (n: number) => `${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

function MaterialPage() {
  const { data, addMaterial, deleteMaterial, setMaterialBudget } = useStore();
  const [month, setMonth] = useState(monthKey());

  const items = useMemo(
    () => data.materials.filter((m) => m.purchaseDate.startsWith(month)),
    [data.materials, month],
  );
  const spent = items.reduce((sum, m) => sum + m.unitCost * m.quantity, 0);
  const budget = data.materialBudgets.find((b) => b.month === month)?.amount ?? 0;
  const remaining = budget - spent;
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

  const byCategory = useMemo(() => {
    const map = new Map<MaterialCategory, number>();
    for (const m of items) map.set(m.category, (map.get(m.category) ?? 0) + m.unitCost * m.quantity);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const yearTotal = data.materials
    .filter((m) => m.purchaseDate.startsWith(month.slice(0, 4)))
    .reduce((sum, m) => sum + m.unitCost * m.quantity, 0);

  return (
    <>
      <PageHeader
        title="Material"
        subtitle="Inventario de compras y presupuesto de gasto"
        action={<MaterialDialog onSave={addMaterial} defaultMonth={month} />}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="space-y-1">
          <Label htmlFor="mes">Mes</Label>
          <Input
            id="mes"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value || monthKey())}
            className="w-[170px]"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="presupuesto">Presupuesto del mes (€)</Label>
          <Input
            id="presupuesto"
            type="number"
            min={0}
            step="10"
            defaultValue={budget || ""}
            key={`${month}-${budget}`}
            placeholder="0"
            className="w-[170px]"
            onBlur={(e) => {
              const value = Number(e.target.value || 0);
              if (value !== budget) {
                void setMaterialBudget(month, value).then(() => toast.success("Presupuesto actualizado"));
              }
            }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Gastado este mes" value={eur(spent)} icon={Package} />
        <StatCard label="Presupuesto" value={budget > 0 ? eur(budget) : "Sin definir"} icon={Wallet} />
        <StatCard
          label={remaining >= 0 ? "Disponible" : "Te has pasado"}
          value={eur(Math.abs(remaining))}
          icon={Wallet}
          tone={budget > 0 && remaining < 0 ? "danger" : "default"}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Consumo del presupuesto</span>
          <span className={cn("text-xs", budget > 0 && remaining < 0 ? "text-destructive" : "text-muted-foreground")}>
            {budget > 0 ? `${Math.round((spent / budget) * 100)}% usado` : "Define un presupuesto para el mes"}
          </span>
        </div>
        <Progress value={pct} className="mt-2" />
        <p className="mt-2 text-xs text-muted-foreground">Gasto acumulado en {month.slice(0, 4)}: {eur(yearTotal)}</p>

        {byCategory.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {byCategory.map(([cat, total]) => (
              <span key={cat} className="rounded-lg bg-secondary px-2 py-1 text-xs">
                {MATERIAL_CATEGORY_LABELS[cat]} · <span className="font-semibold text-primary">{eur(total)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Package className="size-6" />
          </span>
          <p className="mt-3 text-sm font-semibold">Sin material registrado este mes</p>
          <p className="mt-1 text-xs text-muted-foreground">Añade palas, pelotas o cualquier compra para controlar el gasto.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{m.name}</p>
                  <span className="rounded-lg bg-secondary px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {MATERIAL_CATEGORY_LABELS[m.category]}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {format(parseISO(m.purchaseDate), "d MMM yyyy", { locale: es })} · {m.quantity} ud ×{" "}
                  {eur(m.unitCost)}
                  {m.supplier && ` · ${m.supplier}`}
                </p>
                {m.notes && <p className="mt-1 text-xs text-muted-foreground">{m.notes}</p>}
              </div>
              <p className="font-display text-base font-bold text-primary">{eur(m.unitCost * m.quantity)}</p>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Eliminar ${m.name}`}
                onClick={() => {
                  void deleteMaterial(m.id).then(() => toast.success("Material eliminado"));
                }}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: typeof Package;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="size-4 text-primary" /> {label}
      </div>
      <p className={cn("mt-1.5 font-display text-2xl font-bold", tone === "danger" ? "text-destructive" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

function MaterialDialog({
  onSave,
  defaultMonth,
}: {
  onSave: ReturnType<typeof useStore>["addMaterial"];
  defaultMonth: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("pelotas");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    defaultMonth === monthKey() ? todayKey() : `${defaultMonth}-01`,
  );
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Pon un nombre al material");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        quantity: Math.max(1, Number(quantity) || 1),
        unitCost: Number(unitCost) || 0,
        purchaseDate,
        supplier: supplier.trim(),
        notes: notes.trim(),
      });
      toast.success("Material añadido");
      setName("");
      setQuantity("1");
      setUnitCost("");
      setSupplier("");
      setNotes("");
      setOpen(false);
    } catch {
      toast.error("No se ha podido guardar el material");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Añadir material
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo material</DialogTitle>
          <DialogDescription>Registra la compra para llevar el control del presupuesto.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="mat-nombre">Material</Label>
            <Input
              id="mat-nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Bote de pelotas Head Pro"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mat-cat">Categoría</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as MaterialCategory)}>
                <SelectTrigger id="mat-cat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MATERIAL_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-fecha">Fecha de compra</Label>
              <Input
                id="mat-fecha"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-cant">Cantidad</Label>
              <Input
                id="mat-cant"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-precio">Precio por unidad (€)</Label>
              <Input
                id="mat-precio"
                type="number"
                min={0}
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mat-prov">Proveedor / tienda</Label>
            <Input
              id="mat-prov"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Ej. Padel Nuestro"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mat-notas">Notas</Label>
            <Textarea
              id="mat-notas"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Para los grupos de iniciación"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-primary">
              {eur((Number(unitCost) || 0) * (Number(quantity) || 0))}
            </span>
          </p>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving ? "Guardando…" : "Guardar material"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
