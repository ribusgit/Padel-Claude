import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, PlayCircle, Plus, Save, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useExercises, type Exercise } from "@/lib/exercises";
import { LEVEL_LABELS, type LevelCategory } from "@/lib/padel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ejercicios")({
  head: () => ({
    meta: [
      { title: "Ejercicios por nivel — Padel Time" },
      { name: "description", content: "Sube y ordena los ejercicios de cada nivel que usa el trimestre de Pista." },
      { property: "og:title", content: "Ejercicios por nivel — Padel Time" },
      { property: "og:description", content: "Sube y ordena los ejercicios de cada nivel que usa el trimestre de Pista." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExercisesPage,
});

function ExercisesPage() {
  const { items, loading, reload } = useExercises();
  const [level, setLevel] = useState<LevelCategory>("iniciacion");
  const [trimester, setTrimester] = useState(1);
  const [draft, setDraft] = useState({ title: "", description: "", videoUrl: "" });
  const list = items.filter((e) => e.level === level && e.trimester === trimester);

  const add = async () => {
    if (!draft.title.trim()) { toast.error("Escribe el nombre del ejercicio"); return; }
    const { error } = await supabase.from("exercises").insert({
      level,
      trimester,
      position: (list.at(-1)?.position ?? -1) + 1,
      title: draft.title.trim(),
      description: draft.description.trim(),
      video_url: draft.videoUrl.trim(),
    });
    if (error) { toast.error("No se pudo guardar"); return; }
    setDraft({ title: "", description: "", videoUrl: "" });
    toast.success("Ejercicio añadido");
    void reload();
  };

  const move = async (i: number, dir: -1 | 1) => {
    const a = list[i], b = list[i + dir];
    if (!a || !b) return;
    await supabase.from("exercises").update({ position: b.position }).eq("id", a.id);
    await supabase.from("exercises").update({ position: a.position }).eq("id", b.id);
    void reload();
  };

  const remove = async (e: Exercise) => {
    if (!confirm(`¿Eliminar "${e.title}"?`)) return;
    await supabase.from("exercises").delete().eq("id", e.id);
    void reload();
  };

  const chip = (active: boolean) =>
    cn("rounded-xl border px-3 py-2 text-sm font-medium", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card");

  return (
    <>
      <PageHeader title="Ejercicios" subtitle="El orden de la lista es el orden de las clases del trimestre en Pista" />
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(LEVEL_LABELS) as LevelCategory[]).map((l) => (
          <button key={l} className={chip(level === l)} onClick={() => setLevel(l)}>{LEVEL_LABELS[l]}</button>
        ))}
        <span className="mx-1 w-px bg-border" />
        {[1, 2, 3].map((t) => (
          <button key={t} className={chip(trimester === t)} onClick={() => setTrimester(t)}>{t}.º trimestre</button>
        ))}
      </div>

      <div className="mb-6 space-y-2 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Nuevo ejercicio de {LEVEL_LABELS[level]} · {trimester}.º trimestre</p>
        <Input placeholder="Nombre" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <Textarea placeholder="Explicación" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        <Input placeholder="Enlace del vídeo (YouTube, etc.)" value={draft.videoUrl} onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })} />
        <Button onClick={() => void add()}><Plus className="size-4" /> Añadir</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <ol className="space-y-2">
          {list.map((e, i) => (
            <ExerciseRow key={e.id} e={e} n={i + 1} onUp={() => void move(i, -1)} onDown={() => void move(i, 1)} onDelete={() => void remove(e)} onSaved={() => void reload()} />
          ))}
        </ol>
      )}
    </>
  );
}

function ExerciseRow({ e, n, onUp, onDown, onDelete, onSaved }: { e: Exercise; n: number; onUp: () => void; onDown: () => void; onDelete: () => void; onSaved: () => void }) {
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ title: e.title, description: e.description, videoUrl: e.videoUrl });
  const save = async () => {
    const { error } = await supabase.from("exercises").update({ title: f.title, description: f.description, video_url: f.videoUrl }).eq("id", e.id);
    if (error) { toast.error("No se pudo guardar"); return; }
    setEdit(false);
    onSaved();
  };
  return (
    <li className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary font-display text-sm font-bold">{n}</span>
        <div className="min-w-0 flex-1 space-y-2">
          {edit ? (
            <>
              <Input value={f.title} onChange={(x) => setF({ ...f, title: x.target.value })} />
              <Textarea value={f.description} onChange={(x) => setF({ ...f, description: x.target.value })} />
              <Input value={f.videoUrl} placeholder="Enlace del vídeo" onChange={(x) => setF({ ...f, videoUrl: x.target.value })} />
              <Button size="sm" onClick={() => void save()}><Save className="size-4" /> Guardar</Button>
            </>
          ) : (
            <button className="block text-left" onClick={() => setEdit(true)}>
              <p className="font-medium">{e.title}</p>
              {e.description && <p className="text-sm text-muted-foreground">{e.description}</p>}
            </button>
          )}
          {!edit && e.videoUrl && (
            <a href={e.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              <PlayCircle className="size-3.5" /> Ver vídeo
            </a>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Button size="icon" variant="ghost" aria-label="Subir" onClick={onUp}><ArrowUp className="size-4" /></Button>
          <Button size="icon" variant="ghost" aria-label="Bajar" onClick={onDown}><ArrowDown className="size-4" /></Button>
          <Button size="icon" variant="ghost" aria-label="Eliminar" onClick={onDelete}><Trash2 className="size-4 text-destructive" /></Button>
        </div>
      </div>
    </li>
  );
}
