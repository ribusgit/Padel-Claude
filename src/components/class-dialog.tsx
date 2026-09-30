import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LevelBadge } from "@/components/padel-ui";
import { ExerciseDiagram } from "@/components/session-development";
import { useExercises } from "@/lib/exercises";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  COURTS,
  LEVEL_LABELS,
  LEVEL_RANGES,
  MAX_STUDENTS_PER_CLASS,
  CLASS_DURATIONS,
  HALF_HOUR_SLOTS,
  classEndTime,
  classesOverlap,
  levelCategory,
  todayKey,
  type ClassSession,
  type LevelCategory,
} from "@/lib/padel";

export function ClassDialog({
  trigger,
  defaultDate,
  defaultTime,
  defaultCourt,
  session,
}: {
  trigger: ReactNode;
  defaultDate?: string;
  defaultTime?: string;
  defaultCourt?: number;
  session?: ClassSession;
}) {
  const { data, addClass, updateClass, isAdmin, coachId: myCoachId } = useStore();
  const editing = Boolean(session);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(defaultDate ?? todayKey());
  const [time, setTime] = useState(defaultTime ?? "18:00");
  const [court, setCourt] = useState(defaultCourt ? String(defaultCourt) : "1");
  const [coachId, setCoachId] = useState(isAdmin ? (data.coaches[0]?.id ?? "") : (myCoachId ?? ""));
  const [level, setLevel] = useState<LevelCategory>("intermedio");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [isTrial, setIsTrial] = useState(false);
  const [duration, setDuration] = useState(60);
  const [plan, setPlan] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const { items: exercises } = useExercises();
  const selectedExercise = exercises.find((exercise) => exercise.id === exerciseId);

  const resetFromSession = () => {
    if (!session) return;
    setDate(session.date);
    setTime(session.time);
    setCourt(String(session.court));
    setCoachId(session.coachId ?? "");
    setLevel(session.level);
    setStudentIds(session.studentIds);
    setIsTrial(session.isTrial ?? false);
    setDuration(session.durationMin || 60);
    setPlan(session.plan ?? "");
    setExerciseId(session.exerciseId ?? "");
  };

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
    const clash = data.classes.some(
      (c) =>
        c.id !== session?.id &&
        c.date === date &&
        c.court === Number(court) &&
        classesOverlap(c.time, c.durationMin || 60, time, duration),
    );
    if (clash) {
      toast.error(`La pista ${court} ya está ocupada entre las ${time} y las ${classEndTime(time, duration)}`);
      return;
    }
    if (editing && session) {
      void updateClass(session.id, { date, time, durationMin: duration, court: Number(court), coachId, level, studentIds, isTrial, plan, exerciseId });
      toast.success("Clase actualizada");
    } else {
      void addClass({ date, time, durationMin: duration, court: Number(court), coachId, level, studentIds, isTrial, plan, exerciseId });
      toast.success("Clase programada");
    }
    setOpen(false);
    if (!editing) setStudentIds([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && session) resetFromSession();
        if (o && defaultDate) setDate(defaultDate);
        if (o && defaultTime) setTime(defaultTime);
        if (o && defaultCourt) setCourt(String(defaultCourt));
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar clase" : "Programar clase"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Día</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Hora de inicio</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HALF_HOUR_SLOTS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Hora de final</Label>
            <div className="grid grid-cols-4 gap-2">
              {CLASS_DURATIONS.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDuration(d)}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-center transition-colors",
                    duration === d ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
                  )}
                >
                  <p className="font-display text-sm font-bold">{classEndTime(time, d)}</p>
                  <p className="text-[11px] text-muted-foreground">{{ 30: "30 min", 60: "1 h", 90: "1 h 30", 120: "2 h" }[d]}</p>
                </button>
              ))}
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
              {!isAdmin ? <p className="flex h-10 items-center rounded-md border border-border px-3 text-sm">{data.coaches.find((c) => c.id === coachId)?.name ?? "Tú"}</p> : <Select value={coachId} onValueChange={setCoachId}>
                <SelectTrigger><SelectValue placeholder="Elegir" /></SelectTrigger>
                <SelectContent>
                  {data.coaches.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>}
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
                    setExerciseId("");
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
          <div className="space-y-1.5">
            <Label htmlFor="exercise">Ejercicio de la sesión</Label>
            <select
              id="exercise"
              value={exerciseId}
              onChange={(e) => {
                const ex = exercises.find((x) => x.id === e.target.value);
                setExerciseId(e.target.value);
                if (ex && !plan.trim()) setPlan(`${ex.title}\n\n${ex.description}${ex.videoUrl ? `\n\nVídeo: ${ex.videoUrl}` : ""}`);
              }}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">Sin ejercicio asignado</option>
              {[1, 2, 3].map((t) => (
                <optgroup key={t} label={`${t}.º trimestre`}>
                  {exercises.filter((x) => x.level === level && x.trimester === t).map((x) => (
                    <option key={x.id} value={x.id}>{x.position + 1}. {x.title}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {selectedExercise && (
              <div className="mt-2">
                <ExerciseDiagram title={selectedExercise.title} diagramType={selectedExercise.diagramType} />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan">Desarrollo</Label>
            <Textarea
              id="plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="Ejercicios y desarrollo de la clase…"
              rows={5}
              className="resize-y"
            />
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
