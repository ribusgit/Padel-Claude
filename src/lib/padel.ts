import { addDays, format, subDays } from "date-fns";

export type PaymentStatus = "pagado" | "pendiente";
export type Plan = "1x" | "2x" | "particular";
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
}

export interface Payment {
  id: string;
  studentId: string;
  month: string; // yyyy-MM
  amount: number;
  paid: boolean;
  paidAt?: string;
}

export interface AppData {
  students: Student[];
  coaches: Coach[];
  classes: ClassSession[];
  payments: Payment[];
}

export const COURTS = [1, 2, 3, 4];
export const MAX_STUDENTS_PER_CLASS = 4;

export const PLAN_LABELS: Record<Plan, string> = {
  "1x": "1 clase/semana",
  "2x": "2 clases/semana",
  particular: "Clases particulares",
};

export const PLAN_PRICES: Record<Plan, number> = {
  "1x": 55,
  "2x": 95,
  particular: 140,
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
  }));

  return { students, coaches, classes, payments };
}
