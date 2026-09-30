import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EXERCISE_BANK, type LevelCategory } from "@/lib/padel";

export type Exercise = {
  id: string;
  level: LevelCategory;
  position: number;
  title: string;
  description: string;
  videoUrl: string;
  trimester: number;
  diagramType: ExerciseDiagramType;
};

export type ExerciseDiagramType = "auto" | "rally" | "serve" | "net" | "lob";

/** Ejercicios guardados por el profesor; si un nivel está vacío se usa el banco por defecto. */
export function useExercises() {
  const [items, setItems] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data } = await supabase.from("exercises").select("*").order("position");
    setItems(
      (data ?? []).map((r) => ({
        id: r.id,
        level: r.level as LevelCategory,
        position: r.position,
        title: r.title,
        description: r.description,
        videoUrl: r.video_url,
        trimester: r.trimester,
        diagramType: r.diagram_type as ExerciseDiagramType,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const byLevel = (level: LevelCategory, trimester = 1): Exercise[] => {
    const list = items.filter((e) => e.level === level && e.trimester === trimester);
    if (list.length) return list;
    return EXERCISE_BANK[level].map((t, i) => ({ id: `default-${i}`, level, position: i, title: t, description: "", videoUrl: "", trimester, diagramType: "auto" }));
  };

  return { items, loading, reload, byLevel };
}

/** Plan de `total` clases a partir de la lista del nivel; la última es la evaluación final. */
export function planFrom(list: Exercise[], total: number): Exercise[] {
  return Array.from({ length: total }, (_, i) => {
    if (i === total - 1 || !list.length)
      return { id: `final-${i}`, level: list[0]?.level ?? "iniciacion", position: i, title: "Evaluación final del trimestre", description: "Repaso de todo lo trabajado y valoración del nivel de cada alumno.", videoUrl: "", trimester: list[0]?.trimester ?? 1, diagramType: "rally" };
    const e = list[i % list.length]!;
    return i >= list.length ? { ...e, title: `${e.title} (repaso)` } : e;
  });
}
