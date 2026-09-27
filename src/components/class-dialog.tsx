import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LevelBadge } from "@/components/padel-ui";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  COURTS,
  LEVEL_LABELS,
  LEVEL_RANGES,
  MAX_STUDENTS_PER_CLASS,
  levelCategory,
  todayKey,
  type LevelCategory,
} from "@/lib/padel";

export function ClassDialog({
  trigger,
  defaultDate,
  defaultTime,
  defaultCourt,
}: {
  trigger: ReactNode;
  defaultDate?: string;
  defaultTime?: string;
  defaultCourt?: number;
}) {
  const { data, addClass } = useStore();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(defaultDate ?? todayKey());
  const [time, setTime] = useState(defaultTime ?? "18:00");
  const [court, setCourt] = useState(defaultCourt ? String(defaultCourt) : "1");
  const [coachId, setCoachId] = useState(data.coaches[0]?.id ?? "");
  const [level, setLevel] = useState<LevelCategory>("intermedio");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [isTrial, setIsTrial] = useState(false);

  const candidates = useMemo(
    () => data.students.filter((s) => s.active && levelCategory(s.level) === level),
    [data.students, level],
  );

  const toggle = (id: string) => {
    setStudentIds((ids) => {
      if (ids.includes(id)) return ids.filter((x) => x !== id);
      if (ids.length >= MAX_STUDENTS_PER_CLASS) {
        toast.warning(`Máximo ${MAX_STUDENTS_PER_CLASS} alumnos por clase`);
        return ids;
      }
      return [...ids, id];
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachId) {
      toast.error("Registra un profesor antes de crear clases");
      return;
    }
    const clash = data.classes.some((c) => c.date === date && c.time === time && c.court === Number(court));
    if (clash) {
      toast.error(`La pista ${court} ya está ocupada a las ${time}`);
      return;
    }
    void addClass({ date, time, durationMin: 60, court: Number(court), coachId, level, studentIds, isTrial });
    toast.success("Clase programada");
    setOpen(false);
    setStudentIds([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && defaultDate) setDate(defaultDate);
        if (o && defaultTime) setTime(defaultTime);
        if (o && defaultCourt) setCourt(String(defaultCourt));
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Programar clase</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Día</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">Hora</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pista</Label>
              <Select value={court} onValueChange={setCourt}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COURTS.map((c) => (
                    <SelectItem key={c} value={String(c)}>Pista {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Profesor</Label>
              <Select value={coachId} onValueChange={setCoachId}>
                <SelectTrigger><SelectValue placeholder="Elegir" /></SelectTrigger>
                <SelectContent>
                  {data.coaches.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Nivel de la clase</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(LEVEL_LABELS) as LevelCategory[]).map((l) => (
                <button
                  type="button"
                  key={l}
                  onClick={() => {
                    setLevel(l);
                    setStudentIds([]);
                  }}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-left transition-colors",
                    level === l ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
                  )}
                >
                  <p className="text-sm font-semibold">{LEVEL_LABELS[l]}</p>
                  <p className="text-[11px] text-muted-foreground">{LEVEL_RANGES[l]}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Alumnos</Label>
              <span className="text-xs text-muted-foreground">
                {studentIds.length}/{MAX_STUDENTS_PER_CLASS}
              </span>
            </div>
            {candidates.length === 0 ? (
              <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                No hay alumnos de nivel {LEVEL_LABELS[level].toLowerCase()}.
              </p>
            ) : (
              <div className="space-y-1.5">
                {candidates.map((s) => {
                  const on = studentIds.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                        on ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
                      )}
                    >
                      <span className="font-medium">{s.name}</span>
                      <LevelBadge level={s.level} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <label className="flex items-center gap-3 rounded-md border border-border p-3 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={isTrial} onChange={(e) => setIsTrial(e.target.checked)} />
            <span><strong>Clase de prueba</strong> · sin coste para los alumnos</span>
          </label>
          <Button type="submit" className="w-full" size="lg">Guardar clase</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
