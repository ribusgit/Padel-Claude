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

export function ExerciseDiagram({ title, diagramType = "auto" }: { title: string; diagramType?: ExerciseDiagramType }) {
  const variant = diagramType === "auto" ? variantFor(title) : diagramType;
  const paths = {
    serve: "M35 160 C75 128 115 105 166 76",
    net: "M54 135 C91 103 124 96 174 62",
    lob: "M38 151 C76 35 130 35 178 145",
    rally: "M38 145 C78 116 132 92 178 61",
  } as const;
  const players: Array<[number, number]> = variant === "net" ? [[54, 95], [78, 95], [164, 54], [187, 54]] : [[45, 148], [76, 148], [159, 48], [190, 48]];

  return (
    <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg border border-primary/30 bg-primary/10" aria-label={`Esquema ilustrativo: ${title}`} role="img">
      <svg viewBox="0 0 224 112" className="absolute inset-0 size-full text-primary" aria-hidden="true">
        <rect x="8" y="8" width="208" height="96" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="112" y1="8" x2="112" y2="104" stroke="currentColor" strokeWidth="1.5" opacity=".55" />
        <line x1="8" y1="56" x2="216" y2="56" stroke="currentColor" strokeWidth="3" />
        <line x1="72" y1="8" x2="72" y2="104" stroke="currentColor" strokeWidth="1" opacity=".5" />
        <line x1="152" y1="8" x2="152" y2="104" stroke="currentColor" strokeWidth="1" opacity=".5" />
        <path d={paths[variant]} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 5" transform="scale(1 .56)" />
        <circle cx={variant === "lob" ? 100 : 145} cy={variant === "lob" ? 28 : 48} r="4" fill="currentColor" />
        {players.map(([x, y], index) => <circle key={index} cx={x} cy={y * .56} r="5" fill={index < 2 ? "currentColor" : "var(--color-foreground)"} />)}
      </svg>
      <span className="absolute bottom-2 left-2 rounded bg-background/80 px-2 py-1 text-[10px] font-semibold uppercase text-foreground">Esquema de pista</span>
    </div>
  );
}

export function SessionDevelopment({ session, exercises, compact = false }: { session: ClassSession; exercises: Exercise[]; compact?: boolean }) {
  const exercise = exercises.find((item) => item.id === session.exerciseId);
  const title = exercise?.title || session.plan?.split("\n").find((line) => line.trim()) || "Ejercicio de la sesión";
  const video = youtubeUrl(session.plan ?? "", title, exercise);
  if (!session.plan && !exercise) return null;

  return (
    <div className="mt-3 rounded-lg border border-border bg-secondary/60 p-3">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Desarrollo</p>
      <div className={compact ? "mt-2 space-y-2" : "mt-2 grid gap-3 sm:grid-cols-[minmax(160px,0.8fr)_minmax(0,1.2fr)]"}>
        <ExerciseDiagram title={title} diagramType={exercise?.diagramType ?? "auto"} />
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