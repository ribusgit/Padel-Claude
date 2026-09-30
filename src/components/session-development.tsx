import { useId } from "react";
import { useDrawings } from "@/lib/drawings";
import { ExternalLink, PlayCircle } from "lucide-react";
import type { Exercise, ExerciseDiagramType } from "@/lib/exercises";
import type { ClassSession } from "@/lib/padel";

const YOUTUBE_URL = /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s]+/i;

function youtubeUrl(plan: string, title: string, exercise?: Exercise) {
  const candidate = exercise?.videoUrl || plan.match(YOUTUBE_URL)?.[0] || "";
  if (!candidate) return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} pádel ejercicio`)}`;
  try {
    const url = new URL(candidate);
    return url.hostname === "youtu.be" || url.hostname.endsWith("youtube.com")
      ? url.toString()
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} pádel ejercicio`)}`;
  } catch {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} pádel ejercicio`)}`;
  }
}

function planParts(plan: string) {
  const parts: Array<{ text: string; href?: string }> = [];
  let remaining = plan;
  while (remaining) {
    const match = remaining.match(YOUTUBE_URL);
    if (!match || match.index === undefined) {
      parts.push({ text: remaining });
      break;
    }
    if (match.index > 0) parts.push({ text: remaining.slice(0, match.index) });
    parts.push({ text: match[0], href: match[0] });
    remaining = remaining.slice(match.index + match[0].length);
  }
  return parts;
}

function variantFor(text: string): Exclude<ExerciseDiagramType, "auto"> {
  const normalized = text.toLocaleLowerCase("es");
  if (/saque|resto|servicio/.test(normalized)) return "serve";
  if (/volea|red|bandeja|víbora|remate/.test(normalized)) return "net";
  if (/globo|defensa|pared|fondo/.test(normalized)) return "lob";
  return "rally";
}

type CourtPlayer = { x: number; y: number; label: string; team: "a" | "b" };

const COURT_LAYOUTS: Record<Exclude<ExerciseDiagramType, "auto">, { players: CourtPlayer[]; path: string; ball: [number, number] }> = {
  // Saque: sacador en esquina, resto diagonal; bola hacia el cuadro de saque contrario
  serve: {
    players: [
      { x: 178, y: 86, label: "A1", team: "a" },
      { x: 150, y: 62, label: "A2", team: "a" },
      { x: 42, y: 34, label: "B1", team: "b" },
      { x: 66, y: 56, label: "B2", team: "b" },
    ],
    path: "M170 82 C140 66 110 50 66 30",
    ball: [62, 28],
  },
  // Juego de red: ambas parejas en la red, trayectoria de volea/remate
  net: {
    players: [
      { x: 122, y: 66, label: "A1", team: "a" },
      { x: 122, y: 88, label: "A2", team: "a" },
      { x: 98, y: 32, label: "B1", team: "b" },
      { x: 98, y: 56, label: "B2", team: "b" },
    ],
    path: "M124 72 C112 62 106 52 96 40",
    ball: [93, 37],
  },
  // Globo: defensa en fondo, pareja rival en red, arco alto por encima
  lob: {
    players: [
      { x: 172, y: 78, label: "A1", team: "a" },
      { x: 172, y: 96, label: "A2", team: "a" },
      { x: 96, y: 34, label: "B1", team: "b" },
      { x: 96, y: 58, label: "B2", team: "b" },
    ],
    path: "M168 82 C150 18 110 12 52 40",
    ball: [48, 42],
  },
  // Fondo de pista: rally cruzado entre fondos
  rally: {
    players: [
      { x: 176, y: 74, label: "A1", team: "a" },
      { x: 158, y: 92, label: "A2", team: "a" },
      { x: 44, y: 40, label: "B1", team: "b" },
      { x: 62, y: 22, label: "B2", team: "b" },
    ],
    path: "M172 76 C130 60 90 46 50 34",
    ball: [46, 32],
  },
};

export function ExerciseDiagram({ title, diagramType = "auto" }: { title: string; diagramType?: ExerciseDiagramType }) {
  const variant = diagramType === "auto" ? variantFor(title) : diagramType;
  const { players, path, ball } = COURT_LAYOUTS[variant];

  const uid = useId().replace(/:/g, "");
  const pathId = `ball-path-${uid}`;
  const dur = variant === "lob" ? "3s" : variant === "net" ? "1.6s" : "2.4s";
  // Jugador más cercano al inicio y al final de la trayectoria: son quienes golpean
  const start = path.match(/M\s*([\d.]+)\s+([\d.]+)/);
  const sx = start ? Number(start[1]) : 0;
  const sy = start ? Number(start[2]) : 0;
  const dist = (p: CourtPlayer, x: number, y: number) => Math.hypot(p.x - x, p.y - y);
  const hitterA = players.reduce((a, b) => (dist(b, sx, sy) < dist(a, sx, sy) ? b : a)).label;
  const hitterB = players.reduce((a, b) => (dist(b, ball[0], ball[1]) < dist(a, ball[0], ball[1]) ? b : a)).label;

  return (
    <figure className="w-full overflow-hidden rounded-lg border border-border bg-secondary/40" aria-label={`Animación del ejercicio: ${title}`}>
      <svg viewBox="0 0 220 124" className="block w-full" role="img" aria-hidden="true">
        <defs>
          <marker id={`ball-arrow-${uid}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="3" markerHeight="3" orient="auto-start-reverse">
            <path d="M0 0 L8 4 L0 8 z" className="fill-primary" />
          </marker>
        </defs>
        {/* Pista 20×10 m vista desde arriba */}
        <rect x="10" y="10" width="200" height="104" rx="4" className="fill-primary/10 stroke-foreground/40" strokeWidth="1.5" />
        <line x1="110" y1="10" x2="110" y2="114" className="stroke-foreground" strokeWidth="2.5" />
        <line x1="141" y1="10" x2="141" y2="114" className="stroke-foreground/30" strokeWidth="1" />
        <line x1="79" y1="10" x2="79" y2="114" className="stroke-foreground/30" strokeWidth="1" />
        <line x1="141" y1="62" x2="79" y2="62" className="stroke-foreground/30" strokeWidth="1" />
        {/* Recorrido de la bola */}
        <path id={pathId} d={path} fill="none" className="stroke-primary/50" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 5" markerEnd={`url(#ball-arrow-${uid})`} />
        {/* Muñecos jugando */}
        {players.map((p, i) => {
          const hits = p.label === hitterA || p.label === hitterB;
          const body = p.team === "a" ? "stroke-primary" : "stroke-foreground";
          const head = p.team === "a" ? "fill-primary" : "fill-foreground";
          const swingFrom = p.label === hitterB ? "0.5" : "0";
          return (
            <g key={p.label} transform={`translate(${p.x} ${p.y})`}>
              <g>
                <animateTransform attributeName="transform" type="translate" values="0 0;0 -1.6;0 0" dur="0.7s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
                <line x1="0" y1="-4" x2="0" y2="4" className={body} strokeWidth="2.2" strokeLinecap="round" />
                <line x1="0" y1="4" x2="-3" y2="9" className={body} strokeWidth="2" strokeLinecap="round" />
                <line x1="0" y1="4" x2="3" y2="9" className={body} strokeWidth="2" strokeLinecap="round" />
                <line x1="0" y1="-2" x2="-4" y2="2" className={body} strokeWidth="1.8" strokeLinecap="round" />
                <g>
                  {hits && (
                    <animateTransform attributeName="transform" type="rotate" values="0;-60;25;0" keyTimes="0;0.35;0.5;1" dur={dur} begin={`${Number(swingFrom) * parseFloat(dur)}s`} repeatCount="indefinite" />
                  )}
                  <line x1="0" y1="-2" x2="5" y2="-6" className={body} strokeWidth="1.8" strokeLinecap="round" />
                  <ellipse cx="7" cy="-8" rx="2.6" ry="3.2" className="fill-background/40 stroke-foreground/80" strokeWidth="1" />
                </g>
                <circle cx="0" cy="-7.5" r="3.4" className={`${head} stroke-background`} strokeWidth="1" />
              </g>
              <text x="0" y="17" textAnchor="middle" className="fill-muted-foreground" fontSize="6" fontWeight="700">{p.label}</text>
            </g>
          );
        })}
        {/* Bola en movimiento: ida y vuelta por la trayectoria */}
        <circle r="3.2" className="fill-primary stroke-background" strokeWidth="1.2">
          <animateMotion dur={dur} repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1">
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      </svg>
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-3 py-2 text-[10px] font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> Tu pareja</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-foreground" /> Rivales</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-primary" /> Recorrido de la bola</span>
      </figcaption>
    </figure>
  );
}

export function SessionDevelopment({ session, exercises, compact = false }: { session: ClassSession; exercises: Exercise[]; compact?: boolean }) {
  const exercise = exercises.find((item) => item.id === session.exerciseId);
  const title = exercise?.title || session.plan?.split("\n").find((line) => line.trim()) || "Ejercicio de la sesión";
  const video = youtubeUrl(session.plan ?? "", title, exercise);
  const drawing = useDrawings().find((d) => d.id === session.drawingId);
  if (!session.plan && !exercise && !drawing) return null;

  return (
    <div className="mt-3 rounded-lg border border-border bg-secondary/60 p-3">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Desarrollo</p>
      <div className={compact ? "mt-2 space-y-2" : "mt-2 grid gap-3 sm:grid-cols-[minmax(160px,0.8fr)_minmax(0,1.2fr)]"}>
        {drawing ? (
          <img src={drawing.url} alt={drawing.title} className="w-full rounded-lg border border-border bg-background object-contain" />
        ) : (
          <ExerciseDiagram title={title} diagramType={exercise?.diagramType ?? "auto"} />
        )}
        <div className="min-w-0">
          {exercise && <p className="text-sm font-semibold text-foreground">{exercise.title}</p>}
          {session.plan && (
            <p className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground">
              {planParts(session.plan).map((part, index) => part.href ? (
                <a key={index} href={part.href} target="_blank" rel="noreferrer" className="font-semibold text-primary underline underline-offset-2">{part.text}</a>
              ) : <span key={index}>{part.text}</span>)}
            </p>
          )}
          {video && (
            <a href={video} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
              <PlayCircle className="size-4" /> Ver ejercicio en YouTube <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}