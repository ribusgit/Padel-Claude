import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Camera, ChevronDown, Film, Search, Sparkles, User } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { StudentAvatar } from "@/components/student-avatar";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { isTechniqueReport, type MediaItem } from "@/lib/padel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_admin/informes")({
  head: () => ({
    meta: [
      { title: "Informes de técnica · Escuela de Pádel" },
      { name: "description", content: "Revisión de los análisis de técnica generados con IA para todos los alumnos." },
      { property: "og:title", content: "Informes de técnica · Escuela de Pádel" },
      { property: "og:description", content: "Panel del administrador con los informes de técnica generados con IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InformesPage,
});

function InformesPage() {
  const { data, loading } = useStore();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const reports = useMemo(() => {
    const items = data.media.filter((m) => isTechniqueReport(m.comment));
    return items
      .map((item) => ({
        item,
        student: data.students.find((s) => s.id === item.studentId),
        coach: data.coaches.find((c) => c.id === item.coachId),
      }))
      .filter((r) => r.student)
      .sort((a, b) => b.item.createdAt.localeCompare(a.item.createdAt));
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        r.student!.name.toLowerCase().includes(q) ||
        r.item.title.toLowerCase().includes(q) ||
        r.item.comment.toLowerCase().includes(q),
    );
  }, [reports, query]);

  const studentCount = new Set(reports.map((r) => r.item.studentId)).size;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthCount = reports.filter((r) => r.item.createdAt.startsWith(thisMonth)).length;

  return (
    <>
      <PageHeader
        title="Informes de técnica"
        subtitle={
          loading
            ? "Cargando…"
            : `${reports.length} informes · ${studentCount} alumnos · ${monthCount} este mes`
        }
      />

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por alumno, golpe o contenido del informe…"
          className="h-11 pl-9"
        />
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Cargando informes…</p>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="size-6" />
          </span>
          <p className="mt-3 text-sm font-semibold">
            {reports.length === 0 ? "Todavía no hay informes de técnica" : "Ningún informe coincide con la búsqueda"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {reports.length === 0
              ? "Los análisis generados desde la ficha de cada alumno aparecerán aquí."
              : "Prueba con otro nombre de alumno o golpe."}
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {filtered.map(({ item, student, coach }) => {
            const open = openId === item.id;
            return (
              <li key={item.id} className="rounded-2xl border border-border bg-card">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 p-3 text-left"
                  onClick={() => setOpenId(open ? null : item.id)}
                >
                  <StudentAvatar student={student!} className="size-10" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="truncate text-sm font-semibold">{student!.name}</span>
                      <span className="flex items-center gap-1 rounded-lg bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        {item.kind === "video" ? <Film className="size-3" /> : <Camera className="size-3" />}
                        {item.kind === "video" ? "Vídeo" : "Foto"}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {item.title} · {format(parseISO(item.createdAt), "d MMM yyyy · HH:mm", { locale: es })}
                      {coach ? ` · ${coach.name}` : ""}
                    </span>
                  </span>
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
                </button>

                {open && (
                  <div className="border-t border-border p-3">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                      <Sparkles className="size-3.5" /> Informe generado con IA
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {item.comment}
                    </p>
                    <Link
                      to="/alumnos/$id"
                      params={{ id: student!.id }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground"
                    >
                      <User className="size-3.5" /> Abrir ficha de {student!.name.split(" ")[0]}
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
