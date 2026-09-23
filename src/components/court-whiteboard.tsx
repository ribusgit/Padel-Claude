import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pencil,
  Eraser,
  Minus,
  MoveUpRight,
  Circle,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Hand,
  Video,
  VideoOff,
  SwitchCamera,
  Snowflake,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tool = "pen" | "line" | "arrow" | "circle" | "eraser";

interface Point {
  x: number;
  y: number;
  p: number;
}

interface Stroke {
  tool: Tool;
  color: string;
  width: number;
  points: Point[];
}

const COLORS = [
  { value: "#d4ff3f", label: "Lima" },
  { value: "#ffffff", label: "Blanco" },
  { value: "#ff4d4d", label: "Rojo" },
  { value: "#46b1ff", label: "Azul" },
  { value: "#ffb020", label: "Naranja" },
  { value: "#1a1a1a", label: "Negro" },
];

const TOOLS: { value: Tool; label: string; icon: typeof Pencil }[] = [
  { value: "pen", label: "Lápiz", icon: Pencil },
  { value: "line", label: "Línea", icon: Minus },
  { value: "arrow", label: "Flecha", icon: MoveUpRight },
  { value: "circle", label: "Círculo", icon: Circle },
  { value: "eraser", label: "Borrar", icon: Eraser },
];

const WIDTHS = [
  { value: 3, label: "Fino" },
  { value: 6, label: "Medio" },
  { value: 12, label: "Grueso" },
];

/** Pista de pádel 20x10 m dibujada sobre el lienzo (relación 2:1). */
function drawCourt(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#123326";
  ctx.fillRect(0, 0, w, h);

  const m = Math.min(w, h) * 0.06;
  const cw = w - m * 2;
  const ch = h - m * 2;

  // Superficie de juego
  ctx.fillStyle = "#1c5c43";
  ctx.fillRect(m, m, cw, ch);

  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = Math.max(1.5, w * 0.0025);
  ctx.strokeRect(m, m, cw, ch);

  // Líneas de saque: 6,95 m desde la red (a 3,05 m del fondo)
  const serve = (cw / 20) * 3.05;
  ctx.beginPath();
  ctx.moveTo(m + serve, m);
  ctx.lineTo(m + serve, m + ch);
  ctx.moveTo(m + cw - serve, m);
  ctx.lineTo(m + cw - serve, m + ch);
  // Línea central de saque
  ctx.moveTo(m + serve, m + ch / 2);
  ctx.lineTo(m + cw - serve, m + ch / 2);
  ctx.stroke();

  // Red
  ctx.save();
  ctx.setLineDash([w * 0.012, w * 0.008]);
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = Math.max(2, w * 0.0035);
  ctx.beginPath();
  ctx.moveTo(m + cw / 2, m);
  ctx.lineTo(m + cw / 2, m + ch);
  ctx.stroke();
  ctx.restore();

  // Cristales del fondo y laterales (guía visual)
  ctx.strokeStyle = "rgba(212,255,63,0.35)";
  ctx.lineWidth = Math.max(1, w * 0.002);
  ctx.strokeRect(m * 0.45, m * 0.45, w - m * 0.9, h - m * 0.9);
}

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke, w: number, h: number) {
  const pts = s.points;
  if (pts.length === 0) return;
  const px = (p: Point) => p.x * w;
  const py = (p: Point) => p.y * h;
  const scale = w / 1000;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = s.color;

  if (s.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = s.width * scale * 4;
    ctx.beginPath();
    ctx.moveTo(px(pts[0]!), py(pts[0]!));
    for (const p of pts.slice(1)) ctx.lineTo(px(p), py(p));
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (s.tool === "pen") {
    // Trazo sensible a la presión del Apple Pencil: un segmento por par de puntos
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]!;
      const b = pts[i]!;
      ctx.lineWidth = Math.max(0.6, s.width * scale * (0.45 + b.p * 1.1));
      ctx.beginPath();
      ctx.moveTo(px(a), py(a));
      ctx.lineTo(px(b), py(b));
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  const a = pts[0]!;
  const b = pts[pts.length - 1]!;
  ctx.lineWidth = Math.max(1, s.width * scale);

  if (s.tool === "circle") {
    const cx = (px(a) + px(b)) / 2;
    const cy = (py(a) + py(b)) / 2;
    const rx = Math.abs(px(b) - px(a)) / 2;
    const ry = Math.abs(py(b) - py(a)) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(rx, 2), Math.max(ry, 2), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(px(a), py(a));
  ctx.lineTo(px(b), py(b));
  ctx.stroke();

  if (s.tool === "arrow") {
    const angle = Math.atan2(py(b) - py(a), px(b) - px(a));
    const head = Math.max(10, s.width * scale * 3.5);
    ctx.beginPath();
    ctx.moveTo(px(b), py(b));
    ctx.lineTo(px(b) - head * Math.cos(angle - Math.PI / 7), py(b) - head * Math.sin(angle - Math.PI / 7));
    ctx.moveTo(px(b), py(b));
    ctx.lineTo(px(b) - head * Math.cos(angle + Math.PI / 7), py(b) - head * Math.sin(angle + Math.PI / 7));
    ctx.stroke();
  }
  ctx.restore();
}

export function CourtWhiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const redoRef = useRef<Stroke[]>([]);
  const drawingRef = useRef<{ id: number; stroke: Stroke } | null>(null);
  const lastPenAtRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]!.value);
  const [width, setWidth] = useState(6);
  const [fingerDrawing, setFingerDrawing] = useState(true);
  const [counts, setCounts] = useState({ strokes: 0, redo: 0 });
  const [inputHint, setInputHint] = useState<string | null>(null);

  const repaint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { w, h } = sizeRef.current;
    drawCourt(ctx, w, h);
    for (const s of strokesRef.current) drawStroke(ctx, s, w, h);
    const live = drawingRef.current?.stroke;
    if (live) drawStroke(ctx, live, w, h);
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    sizeRef.current = { w: canvas.width, h: canvas.height };
    repaint();
  }, [repaint]);

  useEffect(() => {
    resize();
    const ro = new ResizeObserver(resize);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [resize]);

  const pointFrom = (e: PointerEvent | React.PointerEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const pressure = e.pointerType === "pen" ? (e.pressure > 0 ? e.pressure : 0.5) : 0.55;
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      p: pressure,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "pen") {
      lastPenAtRef.current = Date.now();
      setInputHint("Apple Pencil detectado · presión activa");
    } else if (e.pointerType === "touch") {
      // Rechazo de palma: con el lápiz en uso, ignoramos el contacto de la mano
      if (!fingerDrawing || Date.now() - lastPenAtRef.current < 1500) return;
      setInputHint("Dibujando con el dedo");
    } else {
      setInputHint(null);
    }
    if (drawingRef.current) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = {
      id: e.pointerId,
      stroke: { tool, color, width, points: [pointFrom(e)] },
    };
    repaint();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const active = drawingRef.current;
    if (!active || active.id !== e.pointerId) return;
    if (e.pointerType === "pen") lastPenAtRef.current = Date.now();

    const events = typeof e.nativeEvent.getCoalescedEvents === "function" ? e.nativeEvent.getCoalescedEvents() : [];
    const points = events.length > 0 ? events.map(pointFrom) : [pointFrom(e)];

    if (active.stroke.tool === "pen" || active.stroke.tool === "eraser") {
      active.stroke.points.push(...points);
    } else {
      active.stroke.points = [active.stroke.points[0]!, points[points.length - 1]!];
    }
    repaint();
  };

  const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const active = drawingRef.current;
    if (!active || active.id !== e.pointerId) return;
    if (e.pointerType === "pen") lastPenAtRef.current = Date.now();
    drawingRef.current = null;
    if (active.stroke.points.length > 1) {
      strokesRef.current.push(active.stroke);
      redoRef.current = [];
      setCounts({ strokes: strokesRef.current.length, redo: 0 });
    }
    repaint();
  };

  const undo = () => {
    const s = strokesRef.current.pop();
    if (s) redoRef.current.push(s);
    setCounts({ strokes: strokesRef.current.length, redo: redoRef.current.length });
    repaint();
  };

  const redo = () => {
    const s = redoRef.current.pop();
    if (s) strokesRef.current.push(s);
    setCounts({ strokes: strokesRef.current.length, redo: redoRef.current.length });
    repaint();
  };

  const clear = () => {
    strokesRef.current = [];
    redoRef.current = [];
    setCounts({ strokes: 0, redo: 0 });
    repaint();
    toast.success("Pizarra limpia");
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `pizarra-padel-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Imagen guardada");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-2.5">
        <div className="flex gap-1.5">
          {TOOLS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTool(value)}
              aria-label={label}
              aria-pressed={tool === value}
              className={cn(
                "flex size-11 items-center justify-center rounded-xl transition-colors",
                tool === value
                  ? "bg-primary text-primary-foreground glow-lime"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 md:ml-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setColor(c.value);
                if (tool === "eraser") setTool("pen");
              }}
              aria-label={c.label}
              aria-pressed={color === c.value}
              className={cn(
                "size-9 rounded-full border-2 transition-transform",
                color === c.value ? "scale-110 border-primary" : "border-border",
              )}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        <div className="flex gap-1.5 md:ml-2">
          {WIDTHS.map((w) => (
            <button
              key={w.value}
              onClick={() => setWidth(w.value)}
              aria-label={`Grosor ${w.label}`}
              aria-pressed={width === w.value}
              className={cn(
                "flex h-11 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors",
                width === w.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              <span className="rounded-full bg-current" style={{ width: w.value + 2, height: w.value + 2 }} />
              {w.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-1.5">
          <button
            onClick={() => setFingerDrawing((v) => !v)}
            aria-pressed={fingerDrawing}
            className={cn(
              "flex h-11 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors",
              fingerDrawing ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
            )}
          >
            <Hand className="size-4" /> Dedo
          </button>
          <Button variant="secondary" size="icon" className="size-11" onClick={undo} disabled={counts.strokes === 0} aria-label="Deshacer">
            <Undo2 />
          </Button>
          <Button variant="secondary" size="icon" className="size-11" onClick={redo} disabled={counts.redo === 0} aria-label="Rehacer">
            <Redo2 />
          </Button>
          <Button variant="secondary" size="icon" className="size-11" onClick={download} aria-label="Guardar imagen">
            <Download />
          </Button>
          <Button variant="secondary" size="icon" className="size-11" onClick={clear} aria-label="Limpiar pizarra">
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card p-2">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={endStroke}
          onContextMenu={(e) => e.preventDefault()}
          className="aspect-[2/1] w-full touch-none select-none rounded-xl"
          style={{ touchAction: "none" }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {inputHint ?? "Dibuja con el Apple Pencil (la presión cambia el grosor) o con el dedo. Con el lápiz en uso se ignora el apoyo de la mano."}
      </p>
    </div>
  );
}
