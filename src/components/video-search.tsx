import { useMemo, useState } from "react";
import { ExternalLink, PlayCircle, Search, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/padel-ui";
import { cn } from "@/lib/utils";
import { levelCategory } from "@/lib/padel";
import type { LevelCategory, Student } from "@/lib/padel";

type Topic = {
  title: string;
  query: string;
  description: string;
  levels: LevelCategory[];
  tags: string[];
};

const TOPICS: Topic[] = [
  {
    title: "Empuñadura continental",
    query: "padel empuñadura continental tutorial",
    description: "Cómo colocar la mano en la pala y por qué es la base de todos los golpes.",
    levels: ["iniciacion", "intermedio"],
    tags: ["empuñadura", "grip", "técnica", "básico"],
  },
  {
    title: "Derecha plana y cruzada",
    query: "padel derecha técnica tutorial",
    description: "Preparación, punto de impacto y acompañamiento en el golpe de derecha.",
    levels: ["iniciacion", "intermedio", "avanzado"],
    tags: ["derecha", "drive", "fondo", "técnica"],
  },
  {
    title: "Revés a una y dos manos",
    query: "padel revés técnica tutorial",
    description: "Errores habituales del revés y ejercicios para ganar control.",
    levels: ["iniciacion", "intermedio", "avanzado"],
    tags: ["revés", "backhand", "técnica"],
  },
  {
    title: "Volea de derecha y revés",
    query: "padel volea técnica tutorial",
    description: "Bloqueo, punto de contacto adelantado y posición en la red.",
    levels: ["iniciacion", "intermedio", "avanzado"],
    tags: ["volea", "red", "bloqueo"],
  },
  {
    title: "Bandeja paso a paso",
    query: "padel bandeja tutorial paso a paso",
    description: "El golpe clave para mantener la red: altura, efecto y colocación.",
    levels: ["intermedio", "avanzado"],
    tags: ["bandeja", "altura", "defensa en red"],
  },
  {
    title: "Víbora",
    query: "padel vibora tutorial",
    description: "Cuándo usar la víbora en lugar de la bandeja y cómo generar efecto cortado.",
    levels: ["intermedio", "avanzado"],
    tags: ["víbora", "efecto", "ataque"],
  },
  {
    title: "Remate y rulo",
    query: "padel remate rulo tutorial",
    description: "Técnica de smash, salida por 3 y 4 metros y remate liftado.",
    levels: ["avanzado"],
    tags: ["remate", "smash", "rulo", "por tres"],
  },
  {
    title: "Salida de pared de fondo",
    query: "padel salida de pared fondo tutorial",
    description: "Lectura del bote, perfil y espera para devolver cómodo desde la pared.",
    levels: ["iniciacion", "intermedio", "avanzado"],
    tags: ["pared", "fondo", "defensa"],
  },
  {
    title: "Doble pared",
    query: "padel doble pared ejercicios",
    description: "Cómo leer la bola que va a lateral y fondo sin perder el equilibrio.",
    levels: ["intermedio", "avanzado"],
    tags: ["doble pared", "lateral", "defensa"],
  },
  {
    title: "Saque y resto",
    query: "padel saque y resto tutorial",
    description: "Saque cortado, subida a la red y devolución profunda del resto.",
    levels: ["iniciacion", "intermedio", "avanzado"],
    tags: ["saque", "resto", "subida"],
  },
  {
    title: "Globo defensivo",
    query: "padel globo defensivo tutorial",
    description: "Altura, profundidad y momento para recuperar la red con el globo.",
    levels: ["iniciacion", "intermedio", "avanzado"],
    tags: ["globo", "defensa", "táctica"],
  },
  {
    title: "Contrapared y chiquita",
    query: "padel chiquita y contrapared tutorial",
    description: "Recursos para incomodar al rival y romper el punto desde el fondo.",
    levels: ["intermedio", "avanzado"],
    tags: ["chiquita", "contrapared", "táctica"],
  },
  {
    title: "Posición y movimientos de pareja",
    query: "padel tactica posicion pareja",
    description: "Desplazamientos coordinados, cobertura de huecos y comunicación.",
    levels: ["iniciacion", "intermedio", "avanzado"],
    tags: ["táctica", "pareja", "posición"],
  },
  {
    title: "Ejercicios de calentamiento",
    query: "padel calentamiento ejercicios antes de jugar",
    description: "Rutina corta de activación y movilidad antes de la clase.",
    levels: ["iniciacion", "intermedio", "avanzado"],
    tags: ["calentamiento", "físico", "prevención"],
  },
  {
    title: "Footwork y preparación física",
    query: "padel footwork ejercicios pies",
    description: "Trabajo de pies, split-step y cambios de dirección específicos de pádel.",
    levels: ["intermedio", "avanzado"],
    tags: ["pies", "físico", "agilidad"],
  },
  {
    title: "Errores típicos de iniciación",
    query: "padel errores principiantes",
    description: "Los fallos más comunes al empezar y cómo corregirlos en pista.",
    levels: ["iniciacion"],
    tags: ["errores", "iniciación", "corrección"],
  },
];

const CATEGORY_LABELS: Record<LevelCategory, string> = {
  iniciacion: "Iniciación",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

function youtubeSearch(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function VideoSearch({ student }: { student: Student }) {
  const category = levelCategory(student.level);
  const [term, setTerm] = useState("");
  const [onlyLevel, setOnlyLevel] = useState(true);

  const results = useMemo(() => {
    const q = term.trim().toLowerCase();
    return TOPICS.filter((topic) => {
      if (onlyLevel && !topic.levels.includes(category)) return false;
      if (!q) return true;
      return (
        topic.title.toLowerCase().includes(q) ||
        topic.description.toLowerCase().includes(q) ||
        topic.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [term, onlyLevel, category]);

  const customQuery = term.trim();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Busca por palabra clave (bandeja, víbora, salida de pared…) y abre vídeos de técnica
          relacionados para enviárselos como deberes a {student.name.split(" ")[0]}.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Ej. bandeja, revés, saque…"
              className="pl-9"
              aria-label="Buscar contenidos de pádel"
            />
          </div>
          {customQuery ? (
            <Button asChild className="shrink-0">
              <a href={youtubeSearch(`padel ${customQuery} tutorial`)} target="_blank" rel="noreferrer">
                <Youtube className="size-4" />
                Buscar vídeos
              </a>
            </Button>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={onlyLevel ? "default" : "outline"}
            onClick={() => setOnlyLevel((value) => !value)}
          >
            Nivel {CATEGORY_LABELS[category]}
          </Button>
          {["bandeja", "víbora", "volea", "salida de pared", "remate", "saque"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTerm(tag)}
              className={cn(
                "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors",
                "hover:border-primary hover:text-primary",
                term === tag && "border-primary text-primary",
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="Sin contenidos para esa búsqueda"
          description="Prueba con otra palabra clave o usa el botón «Buscar vídeos» para abrir la búsqueda completa."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {results.map((topic) => (
            <a
              key={topic.title}
              href={youtubeSearch(topic.query)}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <PlayCircle className="size-5 text-primary" />
                  <span className="font-semibold">{topic.title}</span>
                </div>
                <ExternalLink className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">{topic.description}</p>
              <div className="flex flex-wrap gap-1">
                {topic.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
