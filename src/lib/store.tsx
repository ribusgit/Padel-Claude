import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  seedData,
  uid,
  todayKey,
  monthKey,
  PLAN_PRICES,
  type AppData,
  type Student,
  type Coach,
  type ClassSession,
  type ProgressNote,
  type CourtBooking,
  type MediaItem,
} from "./padel";
import { deleteMediaFile, saveMediaFile } from "./media-db";

const STORAGE_KEY = "escuela-padel-data-v1";

type Updater = (data: AppData) => AppData;

interface StoreApi {
  data: AppData;
  hydrated: boolean;
  addStudent: (s: Omit<Student, "id" | "attendance" | "notes" | "active">) => Student;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  addNote: (studentId: string, note: Omit<ProgressNote, "id">) => void;
  addCoach: (c: Omit<Coach, "id">) => Coach;
  addClass: (c: Omit<ClassSession, "id" | "attendance">) => ClassSession;
  updateClass: (id: string, patch: Partial<ClassSession>) => void;
  deleteClass: (id: string) => void;
  markAttendance: (classId: string, studentId: string, present: boolean) => void;
  setPaid: (studentId: string, paid: boolean) => void;
  addBooking: (b: Omit<CourtBooking, "id">) => CourtBooking;
  deleteBooking: (id: string) => void;
  addMedia: (m: Omit<MediaItem, "id" | "createdAt">, file: Blob) => Promise<MediaItem>;
  updateMedia: (id: string, patch: Partial<MediaItem>) => void;
  deleteMedia: (id: string) => void;
  resetDemo: () => void;
}

/**
 * El contexto se guarda en globalThis para que siga siendo el mismo objeto
 * aunque el módulo se vuelva a evaluar (recargas en caliente del desarrollo o
 * duplicados del grafo de módulos). Si no, useStore no encuentra el proveedor.
 */
const globalRef = globalThis as typeof globalThis & {
  __padelStoreContext?: ReturnType<typeof createContext<StoreApi | null>>;
};
const StoreContext = (globalRef.__padelStoreContext ??= createContext<StoreApi | null>(null));

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => seedData());
  const [hydrated, setHydrated] = useState(false);
  const skipPersist = useRef(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppData>;
        const base = seedData();
        setData({
          students: parsed.students ?? base.students,
          coaches: parsed.coaches ?? base.coaches,
          classes: parsed.classes ?? base.classes,
          payments: parsed.payments ?? base.payments,
          bookings: parsed.bookings ?? base.bookings,
          media: parsed.media ?? [],
        });
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  const update = useCallback((fn: Updater) => setData((d) => fn(d)), []);

  const api = useMemo<StoreApi>(
    () => ({
      data,
      hydrated,
      addStudent: (input) => {
        const student: Student = { ...input, id: uid("s"), active: true, attendance: [], notes: [] };
        update((d) => ({
          ...d,
          students: [...d.students, student],
          payments: [
            ...d.payments,
            {
              id: uid("p"),
              studentId: student.id,
              month: monthKey(),
              amount: PLAN_PRICES[student.plan],
              paid: student.paymentStatus === "pagado",
              paidAt: student.paymentStatus === "pagado" ? todayKey() : undefined,
            },
          ],
        }));
        return student;
      },
      updateStudent: (id, patch) =>
        update((d) => ({
          ...d,
          students: d.students.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
      addNote: (studentId, note) =>
        update((d) => ({
          ...d,
          students: d.students.map((s) =>
            s.id === studentId ? { ...s, notes: [{ ...note, id: uid("n") }, ...s.notes] } : s,
          ),
        })),
      addCoach: (input) => {
        const coach: Coach = { ...input, id: uid("c") };
        update((d) => ({ ...d, coaches: [...d.coaches, coach] }));
        return coach;
      },
      addClass: (input) => {
        const cls: ClassSession = { ...input, id: uid("k"), attendance: {} };
        update((d) => ({ ...d, classes: [...d.classes, cls] }));
        return cls;
      },
      updateClass: (id, patch) =>
        update((d) => ({
          ...d,
          classes: d.classes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      deleteClass: (id) => update((d) => ({ ...d, classes: d.classes.filter((c) => c.id !== id) })),
      markAttendance: (classId, studentId, present) =>
        update((d) => {
          const cls = d.classes.find((c) => c.id === classId);
          if (!cls) return d;
          return {
            ...d,
            classes: d.classes.map((c) =>
              c.id === classId ? { ...c, attendance: { ...c.attendance, [studentId]: present } } : c,
            ),
            students: d.students.map((s) => {
              if (s.id !== studentId) return s;
              const rest = s.attendance.filter((a) => a.classId !== classId);
              return { ...s, attendance: [{ classId, date: cls.date, present }, ...rest] };
            }),
          };
        }),
      setPaid: (studentId, paid) =>
        update((d) => {
          const month = monthKey();
          const exists = d.payments.some((p) => p.studentId === studentId && p.month === month);
          const student = d.students.find((s) => s.id === studentId);
          const payments = exists
            ? d.payments.map((p) =>
                p.studentId === studentId && p.month === month
                  ? { ...p, paid, paidAt: paid ? todayKey() : undefined }
                  : p,
              )
            : [
                ...d.payments,
                {
                  id: uid("p"),
                  studentId,
                  month,
                  amount: student ? PLAN_PRICES[student.plan] : 0,
                  paid,
                  paidAt: paid ? todayKey() : undefined,
                },
              ];
          return {
            ...d,
            payments,
            students: d.students.map((s) =>
              s.id === studentId ? { ...s, paymentStatus: paid ? "pagado" : "pendiente" } : s,
            ),
          };
        }),
      addBooking: (input) => {
        const booking: CourtBooking = { ...input, id: uid("b") };
        update((d) => ({ ...d, bookings: [...d.bookings, booking] }));
        return booking;
      },
      deleteBooking: (id) => update((d) => ({ ...d, bookings: d.bookings.filter((b) => b.id !== id) })),
      addMedia: async (input, file) => {
        const item: MediaItem = { ...input, id: uid("m"), createdAt: new Date().toISOString() };
        await saveMediaFile(item.id, file);
        update((d) => ({ ...d, media: [item, ...d.media] }));
        return item;
      },
      updateMedia: (id, patch) =>
        update((d) => ({ ...d, media: d.media.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      deleteMedia: (id) => {
        void deleteMediaFile(id);
        update((d) => ({ ...d, media: d.media.filter((m) => m.id !== id) }));
      },
      resetDemo: () => {
        window.localStorage.removeItem(STORAGE_KEY);
        setData(seedData());
      },
    }),
    [data, hydrated, update],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
