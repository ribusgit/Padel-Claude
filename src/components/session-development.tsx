import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useDrawings } from "@/lib/drawings";
import { ExternalLink, Pause, Play, PlayCircle, RotateCcw, Snail, Target } from "lucide-react";
import type { Exercise, ExerciseDiagramType } from "@/lib/exercises";
import type { ClassSession } from "@/lib/padel";
import { cn } from "@/lib/utils";

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
  if (/remate|smash|bandeja|víbora|volea|red/.test(normalized)) return "net";
  if (/globo|pared|cristal|defensa|fondo/.test(normalized)) return "lob";
  return "rally";
}

type SessionVisual = { goal: string; steps: [string, string, string]; tip: string };

function visualFor(title: string, fallback: Drill): SessionVisual {
  const text = title.toLocaleLowerCase("es");
  if (/pared|rebote|ángulo|defensa/.test(text)) return {
    goal: "Leer el rebote del cristal, dejar pasar la bola y golpear delante del cuerpo.",
    steps: [
      "El profesor envía la bola profunda para que bote antes del cristal de fondo o lateral.",
      "El alumno se separa de la pared, acompaña el rebote y prepara la pala sin invadir la trayectoria.",
      "Golpea después del rebote, recupera el centro de su lado y vuelve a la posición de espera.",
    ],
    tip: "Primero lee la pared; después muévete. No golpees mientras la bola todavía se acerca al cristal.",
  };
  if (/bandeja|víbora|rulo|remate/.test(text)) return {
    goal: "Resolver el globo alto manteniendo la red y recuperando la posición con la pareja.",
    steps: [
      "El profesor lanza un globo alto y el alumno gira los hombros mientras retrocede de lado.",
      "Se detiene antes de golpear y contacta la bola alta, delante y al lado del cuerpo.",
      "Dirige el golpe al objetivo indicado y vuelve a la red; el compañero cubre el centro.",
    ],
    tip: /remate/.test(text) ? "Solo remata una bola corta y segura; si llega profunda, defiende." : "Control y dirección antes que velocidad; vuelve a la red después del golpe.",
  };
  if (/pareja|transici|situaciones|partido/.test(text)) return {
    goal: "Moverse como pareja: defender juntos, subir juntos y proteger el centro.",
    steps: [
      "Los dos alumnos parten alineados y se avisan antes de jugar la bola del centro.",
      "Quien golpea profundo o juega un buen globo inicia la subida; su compañero acompaña.",
      "La pareja recupera la misma altura y deja libre el menor espacio posible entre ambos.",
    ],
    tip: "La distancia entre compañeros se mantiene: ninguno sube o baja solo.",
  };
  if (/derecha|revés|golpes simples/.test(text) && !/volea/.test(text)) return {
    goal: "Golpear delante del cuerpo y recuperar el centro después de cada derecha o revés.",
    steps: [
      "El profesor alimenta una bola con bote y el alumno gira los hombros antes de que llegue.",
      "El alumno impacta delante, acompaña la bola con un armado corto y dirige al objetivo.",
      "Termina el golpe, vuelve al centro de su lado y prepara la siguiente bola.",
    ],
    tip: "Preparación temprana, punto de impacto delante y potencia moderada.",
  };
  return { goal: fallback.goal, steps: [fallback.steps[0] ?? "", fallback.steps[1] ?? "", fallback.steps[2] ?? ""], tip: fallback.tip };
}

/* ------------------------------------------------------------------ */
/* Ejercicio animado: pista real en perspectiva (vista de televisión). */
/* Coordenadas de pista en metros: u 0→10 (izquierda→derecha),        */
/* v 0→20 (fondo cercano → fondo lejano). Red en v = 10.              */
/* Tu pareja (A) juega en el lado cercano, los rivales (B) en el lejano. */
/* ------------------------------------------------------------------ */

type Pt = [number, number];
type DrillPlayer = { label: string; team: "a" | "b"; at: Pt };
type Shot = { by: string; to: string; bounce?: Pt; lift: number; dur: number; step: number; label: string; h0?: number; moves?: Record<string, Pt> };
type Drill = { players: DrillPlayer[]; shots: Shot[]; target: [number, number, number, number]; goal: string; steps: string[]; tip: string };

const DRILLS: Record<Exclude<ExerciseDiagramType, "auto">, Drill> = {
  serve: {
    players: [
      { label: "A1", team: "a", at: [7.5, 0.8] },
      { label: "A2", team: "a", at: [2.8, 7.2] },
      { label: "B1", team: "b", at: [2.5, 19] },
      { label: "B2", team: "b", at: [7.4, 12.8] },
    ],
    shots: [
      { by: "A1", to: "B1", bounce: [3, 15], lift: 1.2, dur: 1.6, step: 0, label: "A1 saca cruzado", h0: 0.8, moves: { A1: [7, 4] } },
      { by: "B1", to: "A1", lift: 0.9, dur: 1.4, step: 1, label: "B1 resta", moves: { A1: [7, 6.8] } },
      { by: "A1", to: "B1", bounce: [4.5, 15.6], lift: 0.5, dur: 1.2, step: 2, label: "A1 volea al centro", h0: 1.2, moves: { B1: [3.4, 18.4] } },
    ],
    target: [0, 10, 5, 16.95],
    goal: "Sacar cruzado al cuadro contrario y subir a la red.",
    steps: [
      "A1 bota la bola detrás de la línea y saca cruzado, golpeando por debajo de la cintura.",
      "La bola bota en el cuadro contrario (zona amarilla) y B1 resta. A1 ya va hacia la red.",
      "A1 llega a la red junto a A2 y volea al centro, entre los dos rivales.",
    ],
    tip: "Bote antes de la línea y saque cruzado. Mira el cuadro de destino, no la raqueta.",
  },
  net: {
    players: [
      { label: "A1", team: "a", at: [3, 7.2] },
      { label: "A2", team: "a", at: [7, 7.2] },
      { label: "B1", team: "b", at: [3, 18.5] },
      { label: "B2", team: "b", at: [7, 18.5] },
    ],
    shots: [
      { by: "B1", to: "A1", lift: 1, dur: 1.3, step: 0, label: "B1 juega desde el fondo" },
      { by: "A1", to: "B2", bounce: [6.5, 15.6], lift: 0.4, dur: 1.1, step: 1, label: "A1 volea sin dejar botar", h0: 1.2, moves: { B2: [7, 17.8] } },
      { by: "B2", to: "A2", lift: 1.1, dur: 1.3, step: 2, label: "B2 defiende" },
      { by: "A2", to: "B1", bounce: [4.6, 15.8], lift: 0.4, dur: 1.1, step: 2, label: "A2 volea al hueco", h0: 1.2 },
    ],
    target: [3, 14.5, 8, 17.5],
    goal: "Volear desde la red sin dejar botar la bola, hacia los pies del rival.",
    steps: [
      "A1 y A2 esperan a 2-3 m de la red, con la raqueta arriba y delante del cuerpo.",
      "A1 golpea la bola en el aire (sin bote) con un golpe corto, hacia los pies de B2.",
      "Si la bola vuelve, A2 repite la volea al hueco entre los rivales.",
    ],
    tip: "Golpe corto, sin swing: bloquea la bola con un paso adelante.",
  },
  lob: {
    players: [
      { label: "A1", team: "a", at: [3, 1.4] },
      { label: "A2", team: "a", at: [7, 1.6] },
      { label: "B1", team: "b", at: [3, 12.8] },
      { label: "B2", team: "b", at: [7, 12.8] },
    ],
    shots: [
      { by: "B1", to: "A1", bounce: [3.4, 4.6], lift: 0.5, dur: 1.2, step: 0, label: "B1 ataca desde la red", h0: 1.2 },
      { by: "A1", to: "B1", bounce: [4, 18.4], lift: 5.5, dur: 2.4, step: 1, label: "A1 tira un globo alto", h0: 0.7, moves: { B1: [3.6, 19.2], B2: [7, 17.6] } },
      { by: "B1", to: "A2", lift: 2, dur: 1.7, step: 2, label: "B1 defiende y A sube a la red", moves: { A1: [3, 7], A2: [7, 7] } },
    ],
    target: [0, 16.8, 10, 20],
    goal: "Defender desde el fondo con un globo alto que haga retroceder a los rivales.",
    steps: [
      "B1 y B2 atacan desde la red; A1 espera la bola en el fondo, cerca del cristal.",
      "A1 golpea de abajo arriba: la bola pasa alta por encima de B1 y B2 y bota al fondo.",
      "Los rivales tienen que retroceder; A1 y A2 aprovechan para subir a la red.",
    ],
    tip: "Busca altura y profundidad: que la bola bote cerca del fondo contrario.",
  },
  rally: {
    players: [
      { label: "A1", team: "a", at: [7.5, 1.2] },
      { label: "A2", team: "a", at: [2.6, 1.6] },
      { label: "B1", team: "b", at: [2.5, 18.8] },
      { label: "B2", team: "b", at: [7.5, 18.4] },
    ],
    shots: [
      { by: "A1", to: "B1", bounce: [3.2, 15.4], lift: 1.5, dur: 1.6, step: 0, label: "A1 golpea cruzado" },
      { by: "B1", to: "A1", bounce: [6.8, 4.6], lift: 1.5, dur: 1.6, step: 1, label: "B1 devuelve cruzado" },
      { by: "A1", to: "B1", bounce: [2.8, 15], lift: 1.5, dur: 1.6, step: 2, label: "Seguid el peloteo" },
      { by: "B1", to: "A1", bounce: [7.1, 4.2], lift: 1.5, dur: 1.6, step: 2, label: "Seguid el peloteo" },
    ],
    target: [0, 13, 5, 20],
    goal: "Mantener el peloteo cruzado desde el fondo sin fallar.",
    steps: [
      "A1 golpea de derecha desde el fondo, en diagonal (cruzado) hacia B1.",
      "La bola bota en el campo rival y B1 la devuelve también cruzada hacia A1.",
      "Seguid el peloteo: pasad la bola con margen sobre la red, sin buscar potencia.",
    ],
    tip: "Regularidad antes que potencia: bola alta sobre la red y siempre en diagonal.",
  },
};

const RESET = 1.1;
const PX = 26; // píxeles por metro en el fondo cercano
const IDLE = -35;
const BACK = -150;
const FOLLOW = 55;

function proj(u: number, v: number, h = 0) {
  const s = 1 / (1 + v / 20);
  return { x: 160 + (u - 5) * PX * s, y: -140 + 380 * s - h * PX * s, s };
}
const poly = (pts: Array<[number, number, number?]>) =>
  pts.map(([u, v, h = 0]) => { const p = proj(u, v, h); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ");
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
const easeOut = (k: number) => 1 - (1 - k) ** 3;
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function prepare(d: Drill) {
  const positions: Array<Record<string, Pt>> = [Object.fromEntries(d.players.map((p) => [p.label, p.at]))];
  d.shots.forEach((s, i) => positions.push({ ...positions[i], ...(s.moves ?? {}) }));
  const starts: number[] = [];
  let acc = 0;
  d.shots.forEach((s) => { starts.push(acc); acc += s.dur; });
  return { positions, starts, total: acc + RESET, teams: Object.fromEntries(d.players.map((p) => [p.label, p.team])) as Record<string, "a" | "b"> };
}

function contactPoint(team: "a" | "b", at: Pt): Pt {
  return team === "a" ? [at[0] + 0.45, at[1] + 0.3] : [at[0] - 0.45, at[1] - 0.3];
}

function frameAt(d: Drill, prep: ReturnType<typeof prepare>, t: number) {
  let rem = t % prep.total;
  let i = 0;
  while (i < d.shots.length && rem >= d.shots[i]!.dur) { rem -= d.shots[i]!.dur; i++; }
  const reset = i >= d.shots.length;
  const shot = reset ? undefined : d.shots[i];
  const p = shot ? rem / shot.dur : rem / RESET;
  const from = (reset ? prep.positions[d.shots.length] : prep.positions[i])!;
  const to = (reset ? prep.positions[0] : prep.positions[i + 1])!;
  const k = ease(Math.min(1, p / (reset ? 1 : 0.85)));

  const players = d.players.map((pl) => {
    const a = from[pl.label] ?? pl.at;
    const b = to[pl.label] ?? pl.at;
    const moving = dist(a, b) > 0.05 && k < 1;
    const at: Pt = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
    const next = reset ? d.shots[0]?.by : d.shots[i + 1]?.by;
    let angle = IDLE;
    if (shot?.by === pl.label) {
      if (p < 0.2) angle = lerp(BACK, FOLLOW, easeOut(p / 0.2));
      else if (p < 0.45) angle = lerp(FOLLOW, IDLE, (p - 0.2) / 0.25);
    } else if (next === pl.label && p > 0.6) {
      angle = lerp(IDLE, BACK, ease((p - 0.6) / 0.4));
    }
    return { ...pl, at, angle, leg: moving ? Math.sin(t * 16) * 0.11 : 0, hitting: shot?.by === pl.label && p < 0.35 };
  });

  let ball: { g: Pt; h: number } | null = null;
  let bounceSeen = false;
  let trail: Array<[number, number, number]> = [];
  let hit: { at: Pt; h: number } | null = null;
  if (shot) {
    const H = contactPoint(prep.teams[shot.by] ?? "a", from[shot.by] ?? [5, 5]);
    const R = contactPoint(prep.teams[shot.to] ?? "b", to[shot.to] ?? [5, 15]);
    const h0 = shot.h0 ?? 1;
    const at = (q: number): { g: Pt; h: number } => {
      if (shot.bounce) {
        const B = shot.bounce;
        const f = dist(H, B) / (dist(H, B) + dist(B, R));
        if (q < f) {
          const r = q / f;
          return { g: [lerp(H[0], B[0], r), lerp(H[1], B[1], r)], h: h0 * (1 - r) + shot.lift * 4 * r * (1 - r) };
        }
        const r = (q - f) / (1 - f);
        return { g: [lerp(B[0], R[0], r), lerp(B[1], R[1], r)], h: r + Math.min(1.4, shot.lift * 0.6) * 4 * r * (1 - r) };
      }
      return { g: [lerp(H[0], R[0], q), lerp(H[1], R[1], q)], h: h0 * (1 - q) + 1.1 * q + shot.lift * 4 * q * (1 - q) };
    };
    ball = at(p);
    trail = Array.from({ length: 25 }, (_, n) => { const s = at(n / 24); return [s.g[0], s.g[1], s.h]; });
    if (shot.bounce) {
      const f = dist(H, shot.bounce) / (dist(H, shot.bounce) + dist(shot.bounce, R));
      bounceSeen = p >= f;
    }
    if (p < 0.3) hit = { at: H, h: h0 };
  }

  return { players, ball, trail, bounceSeen, hit, shot, p, step: shot ? shot.step : d.steps.length - 1, label: shot ? shot.label : "Vuelta a empezar" };
}

function Figure({ team, angle, leg }: { team: "a" | "b"; angle: number; leg: number }) {
  const shirt = team === "a" ? "#b8f03c" : "#f4f4f5";
  const trim = team === "a" ? "#4d6b10" : "#a1a1aa";
  const shorts = team === "a" ? "#1f2a12" : "#27272a";
  const skin = "#e0a982";
  const hair = team === "a" ? "#3b2a1d" : "#1c1917";
  const back = team === "a";
  return (
    <g transform={back ? undefined : "scale(-1 1)"}>
      {/* Piernas y zapatillas */}
      <path d={`M-0.09 -0.86 L${(-0.13 + leg).toFixed(3)} -0.06 M0.09 -0.86 L${(0.13 - leg).toFixed(3)} -0.06`} stroke={skin} strokeWidth="0.11" strokeLinecap="round" />
      <ellipse cx={-0.14 + leg} cy="-0.03" rx="0.08" ry="0.045" fill="#fafafa" />
      <ellipse cx={0.14 - leg} cy="-0.03" rx="0.08" ry="0.045" fill="#fafafa" />
      <rect x="-0.18" y="-0.98" width="0.36" height="0.24" rx="0.05" fill={shorts} />
      {/* Brazo libre */}
      <path d="M-0.19 -1.36 L-0.32 -1.02" stroke={skin} strokeWidth="0.09" strokeLinecap="round" />
      {/* Cuerpo */}
      <rect x="-0.2" y="-1.44" width="0.4" height="0.54" rx="0.09" fill={shirt} stroke="#0b0d0a" strokeWidth="0.02" />
      <path d="M-0.2 -1.2 H0.2" stroke={trim} strokeWidth="0.04" />
      {/* Cabeza */}
      <rect x="-0.04" y="-1.5" width="0.08" height="0.08" fill={skin} />
      {back ? (
        <>
          <circle cx="-0.135" cy="-1.6" r="0.035" fill={skin} />
          <circle cx="0.135" cy="-1.6" r="0.035" fill={skin} />
          <circle cx="0" cy="-1.62" r="0.14" fill={hair} />
        </>
      ) : (
        <>
          <circle cx="0" cy="-1.62" r="0.14" fill={skin} />
          <path d="M-0.145 -1.63 A0.145 0.145 0 0 1 0.145 -1.63 Q0 -1.69 -0.145 -1.63 Z" fill={hair} />
          <circle cx="-0.05" cy="-1.6" r="0.016" fill="#0b0d0a" />
          <circle cx="0.05" cy="-1.6" r="0.016" fill="#0b0d0a" />
        </>
      )}
      {/* Brazo con pala */}
      <g transform={`translate(0.2 -1.37) rotate(${angle.toFixed(1)})`}>
        <path d="M0 0 L0 0.4" stroke={skin} strokeWidth="0.09" strokeLinecap="round" />
        <path d="M0 0.4 L0 0.57" stroke="#18181b" strokeWidth="0.06" strokeLinecap="round" />
        <ellipse cx="0" cy="0.76" rx="0.14" ry="0.19" fill="#18181b" stroke={shirt} strokeWidth="0.035" />
        <ellipse cx="0" cy="0.76" rx="0.09" ry="0.13" fill="#3f3f46" />
      </g>
    </g>
  );
}

export function ExerciseDiagram({ title, diagramType = "auto" }: { title: string; diagramType?: ExerciseDiagramType }) {
  const variant = diagramType === "auto" ? variantFor(title) : diagramType;
  const drill = DRILLS[variant];
  const visual = visualFor(title, drill);
  const prep = useMemo(() => prepare(drill), [drill]);
  const uid = useId().replace(/:/g, "");
  const ref = useRef<HTMLElement>(null);
  const visible = useRef(true);
  const [t, setT] = useState(0.3);
  const [paused, setPaused] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setPaused(true);
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => { visible.current = e?.isIntersecting ?? true; });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (visible.current) setT((x) => x + dt * (slow ? 0.4 : 1));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, slow]);

  const f = frameAt(drill, prep, t);
  const [tu0, tv0, tu1, tv1] = drill.target;
  const pulse = 0.18 + 0.14 * Math.sin(t * 4);

  const goToStep = (step: number) => {
    const idx = drill.shots.findIndex((s) => s.step === step);
    if (idx >= 0) setT((prep.starts[idx] ?? 0) + 0.01);
  };

  type Item = { v: number; node: React.ReactNode };
  const items: Item[] = f.players.map((pl) => {
    const p = proj(pl.at[0], pl.at[1]);
    const tag = proj(pl.at[0], pl.at[1], 2.1);
    return {
      v: pl.at[1],
      node: (
        <g key={pl.label}>
          <g transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${(PX * p.s).toFixed(2)})`}>
            <ellipse cx="0" cy="0" rx="0.42" ry="0.13" fill="#000" opacity="0.35" />
            <Figure team={pl.team} angle={pl.angle} leg={pl.leg} />
          </g>
          <g transform={`translate(${tag.x.toFixed(1)} ${tag.y.toFixed(1)})`}>
            <rect x="-9" y="-6" width="18" height="10" rx="5" fill={pl.hitting ? "#facc15" : pl.team === "a" ? "#b8f03c" : "#f4f4f5"} stroke="#0b0d0a" strokeWidth="0.6" />
            <text x="0" y="1.6" textAnchor="middle" fontSize="7" fontWeight="800" fill="#0b0d0a">{pl.label}</text>
          </g>
        </g>
      ),
    };
  });
  if (f.ball) {
    const b = proj(f.ball.g[0], f.ball.g[1], f.ball.h);
    const r = 2.2 + 2.2 * b.s;
    items.push({
      v: f.ball.g[1] - 0.01,
      node: (
        <g key="ball">
          <circle cx={b.x} cy={b.y} r={r} fill="#e4ff3a" stroke="#0b0d0a" strokeWidth="0.7" />
          <path d={`M${b.x - r * 0.75} ${b.y - r * 0.25} Q${b.x} ${b.y + r * 0.45} ${b.x + r * 0.75} ${b.y - r * 0.25}`} fill="none" stroke="#fff" strokeWidth="0.6" />
        </g>
      ),
    });
  }
  const far = items.filter((it) => it.v > 10).sort((a, b) => b.v - a.v);
  const near = items.filter((it) => it.v <= 10).sort((a, b) => b.v - a.v);

  const ballShadow = f.ball ? proj(f.ball.g[0], f.ball.g[1]) : null;
  const bounce = f.shot?.bounce && f.bounceSeen ? proj(f.shot.bounce[0], f.shot.bounce[1]) : null;
  const hit = f.hit ? proj(f.hit.at[0], f.hit.at[1], f.hit.h) : null;
  const hitK = f.p / 0.3;
  const captionText = `Paso ${f.step + 1} · ${f.label}`;

  return (
    <figure ref={ref} className="w-full overflow-hidden rounded-lg border border-border bg-card" aria-label={`Animación del ejercicio: ${title}`}>
      <svg viewBox="0 0 320 262" className="block w-full" role="img" aria-hidden="true">
        <defs>
          <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b1626" />
            <stop offset="1" stopColor="#13243a" />
          </linearGradient>
          <linearGradient id={`turf-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b4f97" />
            <stop offset="1" stopColor="#2a6ccb" />
          </linearGradient>
          <pattern id={`mesh-${uid}`} width="3" height="3" patternUnits="userSpaceOnUse">
            <path d="M0 0 L3 3 M3 0 L0 3" stroke="#fff" strokeWidth="0.35" opacity="0.55" />
          </pattern>
          <pattern id={`fence-${uid}`} width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M0 0 L4 4 M4 0 L0 4" stroke="#9ca3af" strokeWidth="0.3" opacity="0.35" />
          </pattern>
        </defs>

        {/* Fondo y alrededores */}
        <rect width="320" height="262" fill={`url(#sky-${uid})`} />
        <polygon points={poly([[-1.5, -1.2], [11.5, -1.2], [11.5, 21], [-1.5, 21]])} fill="#1e3a5f" />
        {/* Superficie */}
        <polygon points={poly([[0, 0], [10, 0], [10, 20], [0, 20]])} fill={`url(#turf-${uid})`} />
        {[2, 4, 6, 8, 12, 14, 16, 18].map((v) => (
          <polyline key={v} points={poly([[0, v], [10, v]])} stroke="#fff" strokeWidth="0.4" opacity="0.05" />
        ))}
        {/* Paredes de la pista de pádel: cristal en el fondo, cristal + malla en los laterales */}
        {/* Cristal del fondo (3 m) con reflejo */}
        <polygon points={poly([[0, 20, 0], [10, 20, 0], [10, 20, 3], [0, 20, 3]])} fill="#a8d4f5" opacity="0.32" stroke="#e2f0fd" strokeOpacity="0.9" strokeWidth="1" />
        <polygon points={poly([[0.6, 20, 0.4], [3.4, 20, 0.4], [2.2, 20, 2.8], [0.6, 20, 2.8]])} fill="#fff" opacity="0.14" />
        <polygon points={poly([[6.2, 20, 0.4], [8.6, 20, 0.4], [7.6, 20, 2.8], [6.2, 20, 2.8]])} fill="#fff" opacity="0.1" />
        {[0, 2.5, 5, 7.5, 10].map((u) => (
          <polyline key={u} points={poly([[u, 20, 0], [u, 20, 3]])} stroke="#374151" strokeWidth="1.4" />
        ))}
        <polyline points={poly([[0, 20, 3], [10, 20, 3]])} stroke="#1f2937" strokeWidth="1.6" />
        {/* Laterales: cristal en el fondo (hasta v=16), malla metálica hacia la red */}
        {[0, 10].map((u) => (
          <g key={u}>
            {/* Cristal lateral del fondo */}
            <polygon points={poly([[u, 16, 0], [u, 20, 0], [u, 20, 3], [u, 16, 3]])} fill="#a8d4f5" opacity="0.3" stroke="#e2f0fd" strokeOpacity="0.85" strokeWidth="0.9" />
            <polygon points={poly([[u, 17, 0.5], [u, 19.4, 0.5], [u, 18.6, 2.7], [u, 17, 2.7]])} fill="#fff" opacity="0.12" />
            {/* Malla metálica de la zona de red */}
            <polygon points={poly([[u, 4, 0], [u, 16, 0], [u, 16, 3], [u, 4, 3]])} fill={`url(#fence-${uid})`} stroke="#9ca3af" strokeOpacity="0.9" strokeWidth="0.9" />
            {/* Cristal lateral cercano a la cámara */}
            <polygon points={poly([[u, 0, 0], [u, 4, 0], [u, 4, 3], [u, 0, 3]])} fill="#a8d4f5" opacity="0.22" stroke="#e2f0fd" strokeOpacity="0.6" strokeWidth="0.9" />
            {/* Postes metálicos */}
            {[4, 7, 10, 13, 16].map((v) => (
              <polyline key={v} points={poly([[u, v, 0], [u, v, 3]])} stroke="#374151" strokeWidth="1.3" />
            ))}
            <polyline points={poly([[u, 0, 3], [u, 20, 3]])} stroke="#1f2937" strokeWidth="1.4" />
          </g>
        ))}
        {/* Líneas */}
        <polygon points={poly([[0, 0], [10, 0], [10, 20], [0, 20]])} fill="none" stroke="#fff" strokeWidth="1.2" />
        <polyline points={poly([[0, 3.05], [10, 3.05]])} stroke="#fff" strokeWidth="1.1" />
        <polyline points={poly([[0, 16.95], [10, 16.95]])} stroke="#fff" strokeWidth="1" />
        <polyline points={poly([[5, 3.05], [5, 16.95]])} stroke="#fff" strokeWidth="1" />
        {/* Zona objetivo */}
        <polygon points={poly([[tu0, tv0], [tu1, tv0], [tu1, tv1], [tu0, tv1]])} fill="#facc15" opacity={pulse} stroke="#facc15" strokeWidth="1" strokeDasharray="4 3" />
        {/* Trayectoria del golpe actual */}
        {f.trail.length > 0 && (
          <polyline points={poly(f.trail)} fill="none" stroke="#facc15" strokeWidth="1.3" strokeDasharray="3 3" strokeOpacity="0.85" />
        )}
        {f.shot?.bounce && (() => { const b = proj(f.shot.bounce[0], f.shot.bounce[1]); return <path d={`M${b.x - 3} ${b.y - 1.5} L${b.x + 3} ${b.y + 1.5} M${b.x + 3} ${b.y - 1.5} L${b.x - 3} ${b.y + 1.5}`} stroke="#facc15" strokeWidth="1.2" />; })()}
        {bounce && (
          <ellipse cx={bounce.x} cy={bounce.y} rx={6 * bounce.s + 4} ry={2.4 * bounce.s + 1.5} fill="none" stroke="#fff" strokeWidth="1" opacity="0.8" />
        )}
        {ballShadow && <ellipse cx={ballShadow.x} cy={ballShadow.y} rx={3 * ballShadow.s + 0.8} ry={1.2 * ballShadow.s + 0.4} fill="#000" opacity="0.4" />}

        {far.map((it) => it.node)}

        {/* Red */}
        <polygon points={poly([[-0.1, 10, 0], [10.1, 10, 0], [10.1, 10, 0.92], [-0.1, 10, 0.92]])} fill={`url(#mesh-${uid})`} />
        <polygon points={poly([[-0.1, 10, 0], [10.1, 10, 0], [10.1, 10, 0.92], [-0.1, 10, 0.92]])} fill="#0b0d0a" opacity="0.25" />
        <polyline points={poly([[-0.1, 10, 0.92], [10.1, 10, 0.92]])} stroke="#fff" strokeWidth="1.8" />
        <polyline points={poly([[-0.1, 10, 0], [-0.1, 10, 1.05]])} stroke="#a1a1aa" strokeWidth="2.4" />
        <polyline points={poly([[10.1, 10, 0], [10.1, 10, 1.05]])} stroke="#a1a1aa" strokeWidth="2.4" />

        {near.map((it) => it.node)}

        {hit && hitK < 1 && (
          <circle cx={hit.x} cy={hit.y} r={4 + hitK * 12 * hit.s} fill="none" stroke="#facc15" strokeWidth={2 * (1 - hitK) + 0.3} opacity={1 - hitK} />
        )}

        {/* Paso actual */}
        <g>
          <rect x="6" y="6" width={captionText.length * 4.7 + 14} height="16" rx="8" fill="#0b0d0a" opacity="0.8" />
          <text x="13" y="17" fontSize="8.5" fontWeight="700" fill="#fff">
            <tspan fill="#b8f03c">Paso {f.step + 1}</tspan> · {f.label}
          </text>
        </g>
      </svg>
      <figcaption className="space-y-2 border-t border-border px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setPaused((x) => !x)} className="inline-flex min-h-8 items-center gap-1 rounded-md bg-secondary px-2 text-[11px] font-semibold text-foreground">
            {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />} {paused ? "Reproducir" : "Pausar"}
          </button>
          <button type="button" onClick={() => setSlow((x) => !x)} className={cn("inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-[11px] font-semibold", slow ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")}>
            <Snail className="size-3.5" /> Cámara lenta
          </button>
          <button type="button" onClick={() => setT(0)} className="inline-flex min-h-8 items-center gap-1 rounded-md bg-secondary px-2 text-[11px] font-semibold text-foreground">
            <RotateCcw className="size-3.5" /> Desde el inicio
          </button>
        </div>
         <p className="flex items-start gap-1.5 text-xs font-semibold text-foreground"><Target className="mt-0.5 size-3.5 shrink-0 text-primary" /> {visual.goal}</p>
        <ol className="space-y-1">
           {visual.steps.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => goToStep(i)}
                className={cn("flex w-full gap-2 rounded-md px-1.5 py-1 text-left text-xs transition-colors", i === f.step ? "bg-primary/15 text-foreground" : "text-muted-foreground")}
              >
                <span className={cn("grid size-4 shrink-0 place-items-center rounded-full text-[10px] font-bold", i === f.step ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")}>{i + 1}</span>
                <span>{s}</span>
              </button>
            </li>
          ))}
        </ol>
         <p className="rounded-md bg-secondary px-2 py-1.5 text-[11px] text-foreground"><span className="font-semibold">Clave: </span>{visual.tip}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> Tu pareja (A), de espaldas</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-foreground" /> Rivales (B)</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-yellow-400" /> Trayectoria y bote (✕)</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-dashed border-yellow-400" /> Zona objetivo</span>
        </div>
      </figcaption>
    </figure>
  );
}

/* Cómo adaptar cada tipo de ejercicio según el número de alumnos (sin contar al profesor). */
const GROUP_TIPS: Record<Exclude<ExerciseDiagramType, "auto">, { one: string; two: string; three: string }> = {
  serve: {
    one: "El alumno saca y sube a la red; el profesor resta y hace de rival. Trabaja el saque cruzado y la subida a volea en cada bola.",
    two: "Cada alumno saca desde un lado por turnos y sube a la red; el profesor resta y devuelve a los dos. Cambiad de lado cada 5 saques.",
    three: "Dos alumnos sacan y suben como pareja; el tercero resta con el profesor. Rotad los papeles cada pocos juegos para que todos saquen y resten.",
  },
  net: {
    one: "El alumno volea en la red y el profesor le tira bolas desde el fondo, primero a la derecha y luego al revés. Series de 8-10 voleas con descanso.",
    two: "Los dos alumnos voleán juntos en la red como pareja; el profesor juega desde el fondo alternando a uno y a otro. Que se llamen la bola.",
    three: "Dos alumnos voleán en la red y el tercero juega desde el fondo con el profesor. Rotad cada 2 minutos para que todos toquen red y fondo.",
  },
  lob: {
    one: "El alumno defiende en el fondo y el profesor ataca desde la red. El alumno responde todo con globos altos hasta lograr subir a la red.",
    two: "Los dos alumnos defienden como pareja en el fondo; el profesor ataca desde la red. Cuando el globo es bueno, suben juntos a la red.",
    three: "Dos alumnos defienden en el fondo y el tercero ataca en la red con el profesor. Rotad atacante y defensores para practicar los dos papeles.",
  },
  rally: {
    one: "Peloteo cruzado alumno contra profesor, cada uno en su diagonal. Contad bolas seguidas sin fallo y poneos un reto (por ejemplo, 20).",
    two: "Peloteo cruzado por parejas: los dos alumnos en un lado contra el profesor, que devuelve a ambos. Alternad quién golpea cada bola.",
    three: "Dos alumnos peloteán como pareja contra el profesor y el tercer alumno. Rotad al alumno que juega con el profesor cada pocos minutos.",
  },
};

function GroupTips({ variant, count }: { variant: Exclude<ExerciseDiagramType, "auto">; count: number }) {
  const tips = GROUP_TIPS[variant];
  const n = Math.min(count, 4);
  const rows: Array<{ label: string; text: string }> = [
    { label: "1 alumno", text: tips.one },
    { label: "2 alumnos", text: tips.two },
    { label: "3 alumnos", text: tips.three },
  ];
  const active = n <= 1 ? 0 : n === 2 ? 1 : 2;
  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Según el número de alumnos</p>
      {rows.map((row, i) => (
        <p key={row.label} className={cn("rounded-md px-2 py-1.5 text-[11px]", i === active ? "bg-primary/15 text-foreground" : "bg-secondary text-muted-foreground")}>
          <span className="font-semibold">{row.label}: </span>{row.text}
        </p>
      ))}
    </div>
  );
}

function DevelopmentText({ plan }: { plan: string }) {
  const blocks = plan.split(/\n{2,}/).filter((block) => block.trim());
  return (
    <div className="mt-1 space-y-2 text-xs text-muted-foreground">
      {blocks.map((block, index) => {
        const separator = block.indexOf(":");
        const label = separator > 0 ? block.slice(0, separator + 1) : "";
        const body = separator > 0 ? block.slice(separator + 1).trimStart() : block;
        return (
          <p key={index} className={cn("whitespace-pre-wrap break-words", /^(Objetivo|Día|Material)/i.test(label) && "text-foreground")}>
            {label && <span className="font-semibold">{label} </span>}
            {planParts(body).map((part, partIndex) => part.href ? (
              <a key={partIndex} href={part.href} target="_blank" rel="noreferrer" className="font-semibold text-primary underline underline-offset-2">{part.text}</a>
            ) : <span key={partIndex}>{part.text}</span>)}
          </p>
        );
      })}
    </div>
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
      <div className={compact ? "mt-2 space-y-2" : "mt-2 grid gap-3 sm:grid-cols-[minmax(200px,1fr)_minmax(0,1fr)]"}>
        {drawing ? (
          <img src={drawing.url} alt={drawing.title} className="w-full rounded-lg border border-border bg-background object-contain" />
        ) : (
          <ExerciseDiagram title={title} diagramType={exercise?.diagramType ?? "auto"} />
        )}
        <div className="min-w-0">
          {exercise && <p className="text-sm font-semibold text-foreground">{exercise.title}</p>}
          {session.plan && <DevelopmentText plan={session.plan} />}
          {video && (
            <a href={video} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
              <PlayCircle className="size-4" /> Ver ejercicio en YouTube <ExternalLink className="size-3.5" />
            </a>
          )}
          <GroupTips variant={exercise?.diagramType && exercise.diagramType !== "auto" ? exercise.diagramType : variantFor(title)} count={session.studentIds.length} />
        </div>
      </div>
    </div>
  );
}
