import { createFileRoute, Link } from "@tanstack/react-router";
import { useExercises, planFrom } from "@/lib/exercises";
import { useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Check, PlayCircle, Send, Pencil } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import {
  COURTS,
  HALF_HOUR_SLOTS,
  LEVEL_LABELS,
  classesOverlap,
  levelCategory,
  todayKey,
  type LevelCategory,
} from "@/lib/padel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pista")({
  head: () => ({
    meta: [
      { title: "Pista — Trimestre de ejercicios · Padel Time" },
      { name: "description", content: "Plan trimestral de ejercicios de pádel por nivel, listo para publicar en el calendario." },
      { property: "og:title", content: "Pista — Trimestre de ejercicios" },
      { property: "og:description", content: "Plan trimestral de ejercicios de pádel por nivel, listo para publicar en el calendario." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PistaPage,
});


function PistaPage() {
  const { data, isAdmin, coachId, addClass } = useStore();
  const [level, setLevel] = useState<LevelCategory>("iniciacion");
  const [total, setTotal] = useState<12 | 23>(12);
  const [trimester, setTrimester] = useState(1);
  const [size, setSize] = useState<2 | 3 | 4>(4);
  const [start, setStart] = useState(todayKey());
  const [time, setTime] = useState("18:00");
  const [court, setCourt] = useState(1);
  const [coach, setCoach] = useState(isAdmin ? (data.coaches[0]?.id ?? "") : (coachId ?? ""));
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [published, setPublished] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const { byLevel, items } = useExercises();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const plan = useMemo(() => planFrom(byLevel(level, trimester), total), [level, total, trimester, items]);
  const dates = useMemo(
    () => plan.map((_, i) => format(addDays(parseISO(start), i * 7), "yyyy-MM-dd")),
    [plan, start],
  );
  const candidates = data.students.filter((s) => s.active && levelCategory(s.level) === level);
  const effectiveCoach = isAdmin ? coach : (coachId ?? "");

  const conflict = (date: string) =>
    data.classes.some(
      (c) => c.date === date && c.court === court && classesOverlap(c.time, c.durationMin, time, 60),
    );

  const toggleStudent = (id: string) =>
    setStudentIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= size ? cur : [...cur, id],
    );

  const publish = async (indices: number[]) => {
    if (!effectiveCoach) {
      toast.error("Elige un profesor");
      return;
    }
    setBusy(true);
    let ok = 0;
    let skipped = 0;
    const done = new Set(published);
    for (const i of indices) {
      const date = dates[i]!;
      if (done.has(i)) continue;
      if (conflict(date)) {
        skipped++;
        continue;
      }
      try {
        await addClass({ date, time, durationMin: 60, court, coachId: effectiveCoach, level, studentIds: studentIds.slice(0, size), exerciseId: plan[i]!.id.includes("-") && plan[i]!.id.length === 36 ? plan[i]!.id : undefined, plan: `${plan[i]!.title}\n\n${plan[i]!.description}${plan[i]!.videoUrl ? `\n\nVídeo: ${plan[i]!.videoUrl}` : ""}`.trim() });
        done.add(i);
        ok++;
      } catch {
        toast.error(`No se pudo publicar la clase ${i + 1}`);
        break;
      }
    }
    setPublished(done);
    setBusy(false);
    if (ok) toast.success(`${ok} clase(s) publicada(s) en el calendario`);
    if (skipped) toast.warning(`${skipped} clase(s) no publicadas: pista ocupada`);
  };

  const chip = (active: boolean) =>
    cn("rounded-xl border px-3 py-2 text-sm font-medium transition-colors", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent");

  return (
    <>
      <PageHeader
        title="Pista"
        subtitle="Trimestre de ejercicios de pádel"
        action={<Button asChild variant="secondary"><Link to="/ejercicios"><Pencil className="size-4" /> Editar ejercicios</Link></Button>}
      />

      <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 md:grid-cols-3">
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Nivel</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LEVEL_LABELS) as LevelCategory[]).map((l) => (
              <button key={l} className={chip(level === l)} onClick={() => { setLevel(l); setStudentIds([]); setPublished(new Set()); }}>{LEVEL_LABELS[l]}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Trimestre</p>
          <div className="flex gap-2">
            {[1, 2, 3].map((t) => (
              <button key={t} className={chip(trimester === t)} onClick={() => { setTrimester(t); setPublished(new Set()); }}>{t}.º</button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Clases</p>
          <div className="flex gap-2">
            {([12, 23] as const).map((n) => (
              <button key={n} className={chip(total === n)} onClick={() => { setTotal(n); setPublished(new Set()); }}>{n} clases</button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Alumnos</p>
          <div className="flex gap-2">
            {([2, 3, 4] as const).map((n) => (
              <button key={n} className={chip(size === n)} onClick={() => { setSize(n); setStudentIds((c) => c.slice(0, n)); }}>{n} alumnos</button>
            ))}
          </div>
        </div>

        <label className="text-sm">
          <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Primera clase</span>
          <input type="date" value={start} onChange={(e) => { setStart(e.target.value); setPublished(new Set()); }} className="h-10 w-full rounded-xl border border-border bg-background px-3" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Hora (1 h)</span>
          <select value={time} onChange={(e) => setTime(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3">
            {HALF_HOUR_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Pista</span>
          <select value={court} onChange={(e) => setCourt(Number(e.target.value))} className="h-10 w-full rounded-xl border border-border bg-background px-3">
            {COURTS.map((c) => <option key={c} value={c}>Pista {c}</option>)}
          </select>
        </label>
        {isAdmin && (
          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Profesor</span>
            <select value={coach} onChange={(e) => setCoach(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3">
              <option value="">Elige profesor</option>
              {data.coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        )}
        <div className="md:col-span-3">
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Grupo ({studentIds.length}/{size})</p>
          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay alumnos de este nivel. Puedes publicar sin alumnos y añadirlos después.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {candidates.map((s) => (
                <button key={s.id} className={chip(studentIds.includes(s.id))} onClick={() => toggleStudent(s.id)}>{s.name}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{LEVEL_LABELS[level]} · {trimester}.º trimestre · {total} clases</h2>
        <Button disabled={busy} onClick={() => void publish(plan.map((_, i) => i))}>
          <Send className="size-4" /> Publicar todo
        </Button>
      </div>
      <ol className="space-y-2">
        {plan.map((ex, i) => {
          const date = dates[i]!;
          const done = published.has(i);
          const busyCourt = !done && conflict(date);
          return (
            <li key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary font-display text-sm font-bold">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{ex.title}</p>
                {ex.description && <p className="mt-0.5 text-sm text-muted-foreground">{ex.description}</p>}
                {ex.videoUrl && (
                  <a href={ex.videoUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <PlayCircle className="size-3.5" /> Ver vídeo
                  </a>
                )}
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(date), "EEE d MMM", { locale: es })} · {time} · Pista {court}
                  {busyCourt && <span className="ml-2 text-warning">Pista ocupada</span>}
                </p>
              </div>
              {done ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-primary"><Check className="size-4" /> Publicada</span>
              ) : (
                <Button size="sm" variant="secondary" disabled={busy || busyCourt} onClick={() => void publish([i])}>Publicar</Button>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
