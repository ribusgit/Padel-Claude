import { addDays, format, subDays } from "date-fns";

export type PaymentStatus = "pagado" | "pendiente";
export type Plan = "1x" | "2x" | "particular" | "prueba";
export type LevelCategory = "iniciacion" | "intermedio" | "avanzado";

export interface AttendanceRecord {
  classId: string;
  date: string;
  present: boolean;
}

export interface ProgressNote {
  id: string;
  date: string;
  coachId: string;
  text: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  email: string;
  enrolledAt: string;
  paymentStatus: PaymentStatus;
  plan: Plan;
  level: number;
  active: boolean;
  /** Ruta de la foto de perfil en el almacenamiento privado. */
  photoPath?: string | undefined;
  attendance: AttendanceRecord[];
  notes: ProgressNote[];
}

export interface Coach {
  id: string;
  name: string;
  phone: string;
  email: string;
  specialty: string;
}

export interface ClassSession {
  id: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  durationMin: number;
  court: number;
  coachId: string;
  level: LevelCategory;
  studentIds: string[];
  attendance: Record<string, boolean>;
  /** Clase de prueba, sin coste para el alumno. */
  isTrial?: boolean | undefined;
  /** Desarrollo de la clase (texto libre, se muestra tal cual). */
  plan?: string | undefined;
  exerciseId?: string | undefined;
  drawingId?: string | undefined;
}

export type PaymentMethod = "tarjeta" | "bizum" | "manual";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  tarjeta: "Tarjeta",
  bizum: "Bizum",
  manual: "Manual",
};

export interface Payment {
  id: string;
  studentId: string;
  month: string; // yyyy-MM
  amount: number;
  paid: boolean;
  paidAt?: string | undefined;
  /** Cómo se cobró la cuota: tarjeta en línea, Bizum o marca manual. */
  method: PaymentMethod;
}

export type BookingType = "clase" | "alquiler";

export interface CourtBooking {
  id: string;
  court: number;
  date: string; // yyyy-MM-dd
  start: string; // HH:mm
  end: string; // HH:mm
  type: BookingType;
  name: string;
  phone?: string | undefined;
  notes?: string | undefined;
}

export type MediaKind = "foto" | "video";

/** Marca con la que empiezan los informes de técnica generados con IA en el comentario del archivo. */
export const TECHNIQUE_REPORT_MARK = "🔬 INFORME DE TÉCNICA";

/** Detecta si el comentario de un archivo multimedia es un informe de técnica con IA. */
export function isTechniqueReport(comment: string): boolean {
  return comment.includes(TECHNIQUE_REPORT_MARK) || comment.includes("GOLPE DETECTADO");
}

export interface MediaItem {
  id: string;
  studentId: string;
  kind: MediaKind;
  title: string;
  comment: string;
  createdAt: string;
  fileName: string;
  mimeType: string;
  size: number;
  coachId?: string | undefined;
}

/** Horario real de apertura del club para un día de la semana (0 = domingo). */
export interface ClubDayHours {
  weekday: number;
  open: string; // HH:mm
  close: string; // HH:mm
  closed: boolean;
}

export type MaterialCategory = "palas" | "pelotas" | "redes" | "ropa" | "mantenimiento" | "otros";

export interface MaterialItem {
  id: string;
  name: string;
  category: MaterialCategory;
  quantity: number;
  unitCost: number;
  purchaseDate: string; // yyyy-MM-dd
  supplier: string;
  notes: string;
}

export interface MaterialBudget {
  month: string; // yyyy-MM
  amount: number;
}

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  palas: "Palas",
  pelotas: "Pelotas",
  redes: "Redes y pista",
  ropa: "Ropa y equipación",
  mantenimiento: "Mantenimiento",
  otros: "Otros",
};

export interface AppData {
  students: Student[];
  coaches: Coach[];
  classes: ClassSession[];
  payments: Payment[];
  bookings: CourtBooking[];
  media: MediaItem[];
  clubHours: ClubDayHours[];
  materials: MaterialItem[];
  materialBudgets: MaterialBudget[];
  /** Cuotas mensuales por tipo de tarifa, editables por el administrador. */
  feePlans: Record<Plan, number>;
  /** Teléfono Bizum del club para cobros manuales. */
  bizumPhone: string;
}

export const COURTS = [1, 2, 3, 4];
export const MAX_STUDENTS_PER_CLASS = 4;


/** Franjas horarias máximas del cuadrante (07:00 – 00:00), se recortan al horario del club. */
export const COURT_HOURS = Array.from({ length: 17 }, (_, i) => `${String(7 + i).padStart(2, "0")}:00`);

/** Franjas de media hora (07:00 – 23:30) para clases y horarios. */
export const HALF_HOUR_SLOTS = Array.from({ length: 34 }, (_, i) => {
  const m = 7 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${m % 60 === 0 ? "00" : "30"}`;
});

/** Duraciones permitidas para una clase (en minutos). */
export const CLASS_DURATIONS = [30, 60, 90, 120];

/** ¿Se solapan dos clases en el tiempo? */
export function classesOverlap(aTime: string, aDur: number, bTime: string, bDur: number) {
  const a = timeToMin(aTime);
  const b = timeToMin(bTime);
  return a < b + bDur && b < a + aDur;
}

export const WEEKDAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const DEFAULT_CLUB_HOURS: ClubDayHours[] = Array.from({ length: 7 }, (_, weekday) => ({
  weekday,
  open: "09:00",
  close: "22:00",
  closed: false,
}));

/** Horario del club para una fecha concreta. */
export function clubHoursForDate(hours: ClubDayHours[], date: Date): ClubDayHours {
  const weekday = date.getDay();
  return hours.find((h) => h.weekday === weekday) ?? { weekday, open: "09:00", close: "22:00", closed: false };
}

/** Franjas de una hora entre la apertura y el cierre del club. */
export function hourSlots(open: string, close: string): string[] {
  const start = Math.floor(timeToMin(open) / 60) * 60;
  const end = timeToMin(close);
  const slots: string[] = [];
  for (let m = start; m + 60 <= end; m += 60) slots.push(minToTime(m));
  return slots;
}

export const BOOKING_LABELS: Record<BookingType, string> = {
  clase: "Clase de la escuela",
  alquiler: "Alquiler libre",
};

export function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minToTime(min: number) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Muestra la hora en formato HH:MM (la base puede guardarla como HH:MM:SS). */
export const hhmm = (time: string) => time.slice(0, 5);

export function classEndTime(time: string, durationMin: number) {

  return minToTime(timeToMin(time) + durationMin);
}

/** ¿Se solapan dos intervalos horarios? */
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return timeToMin(aStart) < timeToMin(bEnd) && timeToMin(bStart) < timeToMin(aEnd);
}

export const PLAN_LABELS: Record<Plan, string> = {
  "1x": "1 clase/semana",
  "2x": "2 clases/semana",
  particular: "Clases particulares",
  prueba: "Alumno de prueba (sin coste)",
};

/** Tarifas iniciales por defecto; la app usa las editables de `AppData.feePlans`. */
export const PLAN_PRICES: Record<Plan, number> = {
  "1x": 55,
  "2x": 95,
  particular: 140,
  prueba: 0,
};

export const LEVEL_LABELS: Record<LevelCategory, string> = {
  iniciacion: "Iniciación",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export const LEVEL_RANGES: Record<LevelCategory, string> = {
  iniciacion: "1.0 – 2.0",
  intermedio: "2.5 – 3.5",
  avanzado: "4.0 – 5.0",
};

export const LEVEL_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export function levelCategory(level: number): LevelCategory {
  if (level <= 2) return "iniciacion";
  if (level <= 3.5) return "intermedio";
  return "avanzado";
}

export function formatLevel(level: number) {
  return level.toFixed(1);
}

export const todayKey = () => format(new Date(), "yyyy-MM-dd");
export const monthKey = (d = new Date()) => format(d, "yyyy-MM");

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function seedData(): AppData {
  const today = new Date();
  const d = (offset: number) => format(addDays(today, offset), "yyyy-MM-dd");
  const month = monthKey(today);

  const coaches: Coach[] = [
    { id: "c1", name: "Carlos Mendoza", phone: "600 111 222", email: "carlos@escuelapadel.es", specialty: "Técnica y competición" },
    { id: "c2", name: "Laura Gil", phone: "600 333 444", email: "laura@escuelapadel.es", specialty: "Iniciación e infantil" },
  ];

  const students: Student[] = [
    {
      id: "s1", name: "Marta Sánchez", phone: "611 223 344", email: "marta@gmail.com",
      enrolledAt: format(subDays(today, 120), "yyyy-MM-dd"), paymentStatus: "pagado", plan: "2x", level: 3, active: true,
      attendance: [
        { classId: "old1", date: d(-7), present: true },
        { classId: "old2", date: d(-4), present: true },
        { classId: "old3", date: d(-2), present: false },
      ],
      notes: [
        { id: "n1", date: d(-7), coachId: "c1", text: "Buen progreso en la volea de revés. Trabajar la bandeja." },
      ],
    },
    {
      id: "s2", name: "Javier Ruiz", phone: "622 334 455", email: "javi.ruiz@hotmail.com",
      enrolledAt: format(subDays(today, 45), "yyyy-MM-dd"), paymentStatus: "pendiente", plan: "1x", level: 1.5, active: true,
      attendance: [
        { classId: "old4", date: d(-7), present: true },
        { classId: "old5", date: d(-14), present: true },
      ],
      notes: [
        { id: "n2", date: d(-7), coachId: "c2", text: "Empieza a controlar el saque. Insistir en la posición de espera." },
      ],
    },
    {
      id: "s3", name: "Elena Torres", phone: "633 445 566", email: "elena.torres@gmail.com",
      enrolledAt: format(subDays(today, 300), "yyyy-MM-dd"), paymentStatus: "pagado", plan: "particular", level: 4.5, active: true,
      attendance: [
        { classId: "old6", date: d(-3), present: true },
        { classId: "old7", date: d(-6), present: true },
        { classId: "old8", date: d(-10), present: true },
      ],
      notes: [
        { id: "n3", date: d(-3), coachId: "c1", text: "Preparación para torneo: remate por 3 muy sólido. Mejorar salida de pared lateral." },
      ],
    },
    {
      id: "s4", name: "Pablo Navarro", phone: "644 556 677", email: "pablo.nav@gmail.com",
      enrolledAt: format(subDays(today, 20), "yyyy-MM-dd"), paymentStatus: "pendiente", plan: "2x", level: 2.5, active: true,
      attendance: [{ classId: "old9", date: d(-5), present: true }],
      notes: [],
    },
    {
      id: "s5", name: "Lucía Fernández", phone: "655 667 788", email: "lucia.fdez@gmail.com",
      enrolledAt: format(subDays(today, 200), "yyyy-MM-dd"), paymentStatus: "pagado", plan: "1x", level: 4, active: true,
      attendance: [
        { classId: "old10", date: d(-7), present: true },
        { classId: "old11", date: d(-14), present: false },
      ],
      notes: [
        { id: "n4", date: d(-14), coachId: "c1", text: "Buena lectura de juego. Trabajar víbora." },
      ],
    },
    {
      id: "s6", name: "Diego Alonso", phone: "666 778 899", email: "diego.alonso@gmail.com",
      enrolledAt: format(subDays(today, 60), "yyyy-MM-dd"), paymentStatus: "pagado", plan: "2x", level: 3.5, active: true,
      attendance: [{ classId: "old12", date: d(-3), present: true }],
      notes: [],
    },
  ];

  const classes: ClassSession[] = [
    { id: "k1", date: d(0), time: "10:00", durationMin: 60, court: 1, coachId: "c2", level: "iniciacion", studentIds: ["s2"], attendance: {} },
    { id: "k2", date: d(0), time: "18:00", durationMin: 60, court: 2, coachId: "c1", level: "intermedio", studentIds: ["s1", "s4", "s6"], attendance: {} },
    { id: "k3", date: d(0), time: "19:30", durationMin: 90, court: 3, coachId: "c1", level: "avanzado", studentIds: ["s3", "s5"], attendance: {} },
    { id: "k4", date: d(1), time: "17:00", durationMin: 60, court: 1, coachId: "c2", level: "iniciacion", studentIds: ["s2", "s4"], attendance: {} },
    { id: "k5", date: d(2), time: "18:00", durationMin: 60, court: 2, coachId: "c1", level: "intermedio", studentIds: ["s1", "s6"], attendance: {} },
    { id: "k6", date: d(3), time: "20:00", durationMin: 60, court: 4, coachId: "c1", level: "avanzado", studentIds: ["s3", "s5"], attendance: {} },
  ];

  const payments: Payment[] = students.map((s) => ({
    id: `p_${s.id}`,
    studentId: s.id,
    month,
    amount: PLAN_PRICES[s.plan],
    paid: s.paymentStatus === "pagado",
    paidAt: s.paymentStatus === "pagado" ? d(-3) : undefined,
    method: "manual",
  }));

  const bookings: CourtBooking[] = [
    { id: "b1", court: 4, date: d(0), start: "11:00", end: "12:30", type: "alquiler", name: "Grupo de Sergio Ramos", phone: "677 123 456" },
    { id: "b2", court: 3, date: d(0), start: "17:00", end: "18:00", type: "clase", name: "Clase de tecnificación", notes: "Bloqueada para grupo de competición" },
    { id: "b3", court: 2, date: d(1), start: "20:00", end: "21:30", type: "alquiler", name: "Ana y Miguel", phone: "688 987 654" },
  ];

  return {
    students,
    coaches,
    classes,
    payments,
    bookings,
    media: [],
    clubHours: DEFAULT_CLUB_HOURS,
    materials: [],
    materialBudgets: [],
    feePlans: PLAN_PRICES,
    bizumPhone: "",
  };
}

/** Banco de ejercicios del trimestre por nivel (compartido por /pista y el portal del alumno). */
export const EXERCISE_BANK: Record<LevelCategory, string[]> = {
  iniciacion: [
    "Introducción al juego y derecha simple con bote",
    "Revés simple con bote",
    "Afianzar derecha y revés e incluir la volea de derecha",
    "Afianzar derecha y revés e incluir la volea de revés",
    "Golpes simples, volea, servicio y resto",
    "Volea dirigida y transición saque-volea",
    "Volea dirigida II",
    "Defensa I. Salida de pared de derecha y de revés",
    "Defensa II. Salida de pared y ángulos",
  ],
  intermedio: [
    "Control de dirección: cruzado vs paralelo",
    "Volea profunda y bloqueo",
    "Bandeja con dirección a la reja",
    "Doble pared y contrapared",
    "Globo ofensivo para recuperar la red",
    "Chiquita al pie del rival",
    "Transiciones fondo-red en pareja",
    "Remate por 3 (salida lateral)",
    "Resto a los pies del que sube",
    "Posicionamiento en pareja defensiva",
    "Bajada de pared agresiva",
    "Partido condicionado por objetivos",
  ],
  avanzado: [
    "Víbora con efecto lateral",
    "Remate por 4 y x3 alternos",
    "Rulo y smash plano",
    "Bajada de pared con aceleración",
    "Volea de dejada y contrapié",
    "Táctica: ocupación del centro",
    "Defensa de remate por 3",
    "Juego de ritmo: cambios de velocidad",
    "Globo al revés del rival zurdo/diestro",
    "Presión en red y cierre del punto",
    "Situaciones de partido: 30-40",
    "Partido de competición con análisis",
  ],
};

/** Plan de `total` clases: recorre el banco y cierra con la evaluación final. */
export function buildExercisePlan(level: LevelCategory, total: number): string[] {
  const bank = EXERCISE_BANK[level];
  return Array.from({ length: total }, (_, i) => {
    if (i === total - 1) return "Evaluación final del trimestre";
    return bank[i % bank.length] + (i >= bank.length ? " (repaso)" : "");
  });
}
