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

type CourtPlayer = { x: number; y: number; label: string; team: "a" | "b"; move?: [number, number] };
type Layout = { players: CourtPlayer[]; path: string; ball: [number, number]; goal: string; steps: string[]; tip: string; target?: [number, number, number, number] };

// Pista 20×10 m: x 20→220 (10 px/m), y 14→118. Red en x=120. Tu pareja (A) a la derecha.
const COURT_LAYOUTS: Record<Exclude<ExerciseDiagramType, "auto">, Layout> = {
  serve: {
    players: [
      { x: 206, y: 96, label: "A1", team: "a" },
      { x: 150, y: 44, label: "A2", team: "a", move: [-6, 0] },
      { x: 36, y: 38, label: "B1", team: "b", move: [8, 4] },
      { x: 80, y: 94, label: "B2", team: "b" },
    ],
    path: "M200 92 C165 70 110 54 64 38",
    ball: [62, 38],
    target: [50, 14, 70, 52],
    goal: "Sacar cruzado al cuadro contrario y subir a la red.",
    steps: ["A1 bota la bola detrás de la línea y saca por debajo de la cintura.", "La bola cruza la red y bota dentro del cuadro marcado.", "B1 resta; A1 avanza hacia la red junto a A2."],
    tip: "Bote antes de la línea de saque y cruzado. Mira el cuadro, no la bola.",
  },
  net: {
    players: [
      { x: 140, y: 42, label: "A1", team: "a" },
      { x: 140, y: 90, label: "A2", team: "a" },
      { x: 58, y: 40, label: "B1", team: "b", move: [0, 6] },
      { x: 58, y: 92, label: "B2", team: "b", move: [0, -6] },
    ],
    path: "M136 46 C118 56 98 64 64 88",
    ball: [62, 88],
    target: [30, 70, 60, 48],
    goal: "Volear sin dejar botar la bola, desde la red, hacia los pies del rival.",
    steps: ["A1 y A2 a 2-3 m de la red, raqueta arriba y delante.", "A1 bloquea la bola con golpe corto, sin swing.", "La bola baja hacia los pies de B2, que defiende desde el fondo."],
    tip: "Paso adelante al golpear y raqueta siempre por encima de la muñeca.",
  },
  lob: {
    players: [
      { x: 204, y: 42, label: "A1", team: "a" },
      { x: 204, y: 90, label: "A2", team: "a" },
      { x: 104, y: 42, label: "B1", team: "b", move: [-26, 0] },
      { x: 104, y: 90, label: "B2", team: "b", move: [-26, 0] },
    ],
    path: "M200 48 C170 -10 70 -6 38 60",
    ball: [38, 60],
    target: [22, 30, 30, 60],
    goal: "Defender desde el fondo con un globo alto que haga retroceder a los rivales.",
    steps: ["A1 espera la bola de fondo, cerca del cristal.", "Golpea de abajo arriba: la bola pasa alta por encima de B1 y B2.", "Los rivales tienen que dejar la red; A1 y A2 suben a ocuparla."],
    tip: "Busca altura y profundidad: que bote cerca del fondo contrario.",
  },
  rally: {
    players: [
      { x: 198, y: 42, label: "A1", team: "a", move: [0, 4] },
      { x: 198, y: 92, label: "A2", team: "a" },
      { x: 42, y: 42, label: "B1", team: "b" },
      { x: 42, y: 92, label: "B2", team: "b", move: [0, -4] },
    ],
    path: "M194 46 C150 58 90 76 46 88",
    ball: [46, 88],
    target: [22, 70, 40, 48],
    goal: "Mantener el peloteo cruzado desde el fondo sin fallar.",
    steps: ["A1 golpea de derecha, cruzado, hacia B2.", "B2 devuelve también cruzado hacia A1.", "Recuperad posición al centro de vuestro lado tras cada golpe."],
    tip: "Pasa la bola con margen sobre la red; prima la regularidad a la potencia.",
  },
};

function Player({ p, hits, dur, delay, i }: { p: CourtPlayer; hits: boolean; dur: string; delay: string; i: number }) {
  const shirt = p.team === "a" ? "#b8f03c" : "#f4f4f5";
  const shorts = p.team === "a" ? "#1f2a12" : "#3f3f46";
  const faceLeft = p.team === "a";
  const [mx, my] = p.move ?? [0, 0];
  return (
    <g transform={`translate(${p.x} ${p.y})`}>
      <g>
        <animateTransform attributeName="transform" type="translate" values={`0 0;${mx} ${my};0 0`} dur={dur} begin={`${i * 0.1}s`} repeatCount="indefinite" />
        <ellipse cx="0" cy="11" rx="7" ry="2.4" fill="#000" opacity="0.3" />
        <g transform={faceLeft ? "scale(-1 1)" : undefined}>
          <g>
            <animateTransform attributeName="transform" type="translate" values="0 0;0 -1.2;0 0" dur="0.6s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
            {/* Piernas */}
            <path d="M-1.5 3 L-3.5 10 M1.5 3 L3.5 10" stroke="#e8b48a" strokeWidth="2" strokeLinecap="round" />
            <rect x="-3.3" y="1" width="6.6" height="3.5" rx="1" fill={shorts} />
            {/* Cuerpo */}
            <rect x="-3.6" y="-6" width="7.2" height="8" rx="2.4" fill={shirt} stroke="#0b0d0a" strokeWidth="0.6" />
            <path d="M-3 -4 L-5.5 0.5" stroke="#e8b48a" strokeWidth="1.7" strokeLinecap="round" />
            {/* Brazo con raqueta */}
            <g transform="translate(3 -4)"><g>
              {hits && <animateTransform attributeName="transform" type="rotate" values="0;-70;30;0" keyTimes="0;0.3;0.42;1" dur={dur} begin={delay} repeatCount="indefinite" />}
              <path d="M0 0 L4 -3" stroke="#e8b48a" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M4 -3 L6 -4.5" stroke="#18181b" strokeWidth="1.6" strokeLinecap="round" />
              <ellipse cx="8.4" cy="-6.6" rx="3" ry="3.6" transform="rotate(-40 8.4 -6.6)" fill="#27272a" stroke={shirt} strokeWidth="0.8" />
            </g></g>
            {/* Cabeza */}
            <circle cx="0" cy="-9.5" r="3.2" fill="#e8b48a" stroke="#0b0d0a" strokeWidth="0.5" />
            <path d="M-3.1 -10 A3.2 3.2 0 0 1 3.1 -10 Z" fill="#3b2a1d" />
          </g>
        </g>
        <rect x="-7" y="13.5" width="14" height="7" rx="3.5" fill={p.team === "a" ? "#b8f03c" : "#f4f4f5"} />
        <text x="0" y="18.8" textAnchor="middle" fontSize="5.5" fontWeight="800" fill="#0b0d0a">{p.label}</text>
      </g>
    </g>
  );
}

export function ExerciseDiagram({ title, diagramType = "auto" }: { title: string; diagramType?: ExerciseDiagramType }) {
  const variant = diagramType === "auto" ? variantFor(title) : diagramType;
  const layout = COURT_LAYOUTS[variant];
  const { players, path, ball } = layout;

  const uid = useId().replace(/:/g, "");
  const pathId = `ball-path-${uid}`;
  const dur = variant === "lob" ? "3.2s" : variant === "net" ? "1.8s" : "2.6s";
  const start = path.match(/M\s*([\d.]+)\s+([\d.]+)/);
  const sx = start ? Number(start[1]) : 0;
  const sy = start ? Number(start[2]) : 0;
  const dist = (p: CourtPlayer, x: number, y: number) => Math.hypot(p.x - x, p.y - y);
  const hitterA = players.reduce((a, b) => (dist(b, sx, sy) < dist(a, sx, sy) ? b : a)).label;
  const hitterB = players.reduce((a, b) => (dist(b, ball[0], ball[1]) < dist(a, ball[0], ball[1]) ? b : a)).label;
  const half = `${parseFloat(dur) / 2}s`;

  return (
    <figure className="w-full overflow-hidden rounded-lg border border-border bg-card" aria-label={`Animación del ejercicio: ${title}`}>
      <svg viewBox="0 0 240 132" className="block w-full" role="img" aria-hidden="true">
        <defs>
          <marker id={`ball-arrow-${uid}`} viewBox="0 0 8 8" refX="6" refY="4" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill="#facc15" />
          </marker>
          <pattern id={`net-${uid}`} width="2" height="2" patternUnits="userSpaceOnUse">
            <path d="M0 0 L2 2 M2 0 L0 2" stroke="#fff" strokeWidth="0.3" opacity="0.7" />
          </pattern>
        </defs>
        {/* Exterior */}
        <rect x="0" y="0" width="240" height="132" fill="#2d6a4f" />
        {/* Superficie de césped azul */}
        <rect x="20" y="14" width="200" height="104" fill="#1d5fa8" />
        <rect x="20" y="14" width="200" height="104" fill="#fff" opacity="0.03" />
        {/* Cristales y malla */}
        <rect x="16" y="10" width="208" height="112" fill="none" stroke="#bfe3ff" strokeOpacity="0.55" strokeWidth="4" />
        <path d="M60 10 H180 M60 122 H180" stroke="#52525b" strokeWidth="4" strokeDasharray="1.5 1.5" />
        {/* Líneas: fondo, saque y central */}
        <rect x="20" y="14" width="200" height="104" fill="none" stroke="#fff" strokeWidth="1.2" />
        <line x1="50.5" y1="14" x2="50.5" y2="118" stroke="#fff" strokeWidth="1" />
        <line x1="189.5" y1="14" x2="189.5" y2="118" stroke="#fff" strokeWidth="1" />
        <line x1="50.5" y1="66" x2="189.5" y2="66" stroke="#fff" strokeWidth="1" />
        {/* Zona objetivo */}
        {layout.target && (
          <rect x={layout.target[0]} y={layout.target[1]} width={layout.target[2]} height={layout.target[3]} fill="#facc15" opacity="0.18" stroke="#facc15" strokeWidth="0.8" strokeDasharray="3 2">
            <animate attributeName="opacity" values="0.1;0.3;0.1" dur="1.6s" repeatCount="indefinite" />
          </rect>
        )}
        {/* Red con postes */}
        <rect x="118.5" y="12" width="3" height="108" fill={`url(#net-${uid})`} />
        <line x1="120" y1="12" x2="120" y2="120" stroke="#fff" strokeWidth="0.8" />
        <circle cx="120" cy="12" r="2" fill="#a1a1aa" />
        <circle cx="120" cy="120" r="2" fill="#a1a1aa" />
        {/* Recorrido */}
        <path id={pathId} d={path} fill="none" stroke="#facc15" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="4 3" markerEnd={`url(#ball-arrow-${uid})`} />
        <g fontSize="6" fontWeight="800" textAnchor="middle">
          <circle cx={sx} cy={sy - 12} r="4.5" fill="#facc15" /><text x={sx} y={sy - 9.8} fill="#0b0d0a">1</text>
          <circle cx={ball[0]} cy={ball[1] - 12} r="4.5" fill="#facc15" /><text x={ball[0]} y={ball[1] - 9.8} fill="#0b0d0a">2</text>
        </g>
        {players.map((p, i) => (
          <Player key={p.label} p={p} i={i} dur={dur} hits={p.label === hitterA || p.label === hitterB} delay={p.label === hitterB ? half : "0s"} />
        ))}
        {/* Sombra y bola */}
        <circle r="2.8" fill="#000" opacity="0.25">
          <animateMotion dur={dur} repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear"><mpath href={`#${pathId}`} /></animateMotion>
        </circle>
        <g>
          <animateMotion dur={dur} repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear"><mpath href={`#${pathId}`} /></animateMotion>
          <g>
            <animateTransform attributeName="transform" type="translate" values={variant === "lob" ? "0 0;0 -10;0 0;0 -10;0 0" : "0 0;0 -4;0 0;0 -4;0 0"} dur={dur} repeatCount="indefinite" />
            <circle r="3" fill="#e4ff3a" stroke="#0b0d0a" strokeWidth="0.6" />
            <path d="M-2.4 -1 Q0 1 2.4 -1" fill="none" stroke="#fff" strokeWidth="0.5" />
          </g>
        </g>
      </svg>
      <figcaption className="space-y-2 border-t border-border px-3 py-2.5">
        <p className="text-xs font-semibold text-foreground">🎯 {layout.goal}</p>
        <ol className="space-y-1">
          {layout.steps.map((s, i) => (
            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
              <span className="grid size-4 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <p className="rounded-md bg-secondary px-2 py-1.5 text-[11px] text-foreground"><span className="font-semibold">Clave: </span>{layout.tip}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> Tu pareja (A)</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-foreground" /> Rivales (B)</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-yellow-400" /> Recorrido de la bola</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-dashed border-yellow-400" /> Zona objetivo</span>
        </div>
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