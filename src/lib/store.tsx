import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { removeMediaFile, uploadMediaFile } from "./media-storage";
import {
  todayKey,
  monthKey,
  PLAN_PRICES,
  DEFAULT_CLUB_HOURS,
  type ClubDayHours,
  type AppData,
  type Student,
  type Coach,
  type ClassSession,
  type ProgressNote,
  type CourtBooking,
  type MediaItem,
  type MaterialItem,
  type MaterialCategory,
  type LevelCategory,
  type Plan,
  type PaymentStatus,
  type BookingType,
  type MediaKind,

} from "./padel";

export type Role = "admin" | "coach";

const EMPTY: AppData = {
  students: [],
  coaches: [],
  classes: [],
  payments: [],
  bookings: [],
  media: [],
  clubHours: DEFAULT_CLUB_HOURS,
  materials: [],
  materialBudgets: [],
};


interface StoreApi {
  data: AppData;
  hydrated: boolean;
  loading: boolean;
  role: Role | null;
  isAdmin: boolean;
  coachId: string | null;
  userName: string;
  email: string;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  addStudent: (s: Omit<Student, "id" | "attendance" | "notes" | "active">) => Promise<Student>;
  updateStudent: (id: string, patch: Partial<Student>) => Promise<void>;
  setStudentPhoto: (id: string, file: Blob | null) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  addNote: (studentId: string, note: Omit<ProgressNote, "id">) => Promise<void>;
  addCoach: (c: Omit<Coach, "id">) => Promise<Coach | null>;
  addClass: (c: Omit<ClassSession, "id" | "attendance">) => Promise<void>;
  updateClass: (id: string, patch: Partial<ClassSession>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  markAttendance: (classId: string, studentId: string, present: boolean) => Promise<void>;
  setPaid: (studentId: string, paid: boolean) => Promise<void>;
  setClubHours: (hours: ClubDayHours[]) => Promise<void>;
  addBooking: (b: Omit<CourtBooking, "id">) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  addMedia: (m: Omit<MediaItem, "id" | "createdAt">, file: Blob) => Promise<void>;
  updateMedia: (id: string, patch: Partial<MediaItem>) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
  addMaterial: (m: Omit<MaterialItem, "id">) => Promise<void>;
  updateMaterial: (id: string, patch: Partial<MaterialItem>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  setMaterialBudget: (month: string, amount: number) => Promise<void>;

}

const globalRef = globalThis as typeof globalThis & {
  __padelStoreContext?: ReturnType<typeof createContext<StoreApi | null>>;
};
const StoreContext = (globalRef.__padelStoreContext ??= createContext<StoreApi | null>(null));

/** Rutas de almacenamiento de cada archivo multimedia (id -> ruta). */
const mediaPaths = new Map<string, string>();
export const mediaPathOf = (id: string) => mediaPaths.get(id);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");

  const refresh = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      setRole(null);
      setData(EMPTY);
      setHydrated(true);
      setLoading(false);
      return;
    }
    setEmail(user.email ?? "");

    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("full_name, coach_id").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    const roles = (rolesRes.data ?? []).map((r) => r.role as Role);
    const myRole: Role | null = roles.includes("admin") ? "admin" : roles.includes("coach") ? "coach" : null;
    setRole(myRole);
    setCoachId(profileRes.data?.coach_id ?? null);
    setUserName(profileRes.data?.full_name ?? user.email ?? "");

    const [students, coaches, classes, attendance, notes, payments, bookings, media, clubHours, materials, budgets] =
      await Promise.all([
        supabase.from("students").select("*").order("name"),
        supabase.from("coaches").select("*").order("name"),
        supabase.from("classes").select("*"),
        supabase.from("attendance").select("*"),
        supabase.from("progress_notes").select("*").order("date", { ascending: false }),
        supabase.from("payments").select("*"),
        supabase.from("bookings").select("*"),
        supabase.from("media").select("*").order("created_at", { ascending: false }),
        supabase.from("club_hours").select("*"),
        supabase.from("material_items").select("*").order("purchase_date", { ascending: false }),
        supabase.from("material_budgets").select("*"),
      ]);


    mediaPaths.clear();
    for (const m of media.data ?? []) mediaPaths.set(m.id, m.storage_path);

    setData({
      students: (students.data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone ?? "",
        email: s.email ?? "",
        enrolledAt: s.enrolled_at,
        paymentStatus: s.payment_status as PaymentStatus,
        plan: s.plan as Plan,
        level: Number(s.level),
        active: s.active,
        photoPath: s.photo_path ?? undefined,
        attendance: (attendance.data ?? [])
          .filter((a) => a.student_id === s.id)
          .map((a) => ({ classId: a.class_id, date: a.date, present: a.present })),
        notes: (notes.data ?? [])
          .filter((n) => n.student_id === s.id)
          .map((n) => ({ id: n.id, date: n.date, coachId: n.coach_id ?? "", text: n.text })),
      })),
      coaches: (coaches.data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone ?? "",
        email: c.email ?? "",
        specialty: c.specialty ?? "",
      })),
      classes: (classes.data ?? []).map((c) => ({
        id: c.id,
        date: c.date,
        time: c.time,
        durationMin: c.duration_min,
        court: c.court,
        coachId: c.coach_id ?? "",
        level: c.level as LevelCategory,
        studentIds: c.student_ids ?? [],
        attendance: (c.attendance ?? {}) as Record<string, boolean>,
      })),
      payments: (payments.data ?? []).map((p) => ({
        id: p.id,
        studentId: p.student_id,
        month: p.month,
        amount: Number(p.amount),
        paid: p.paid,
        paidAt: p.paid_at ?? undefined,
      })),
      bookings: (bookings.data ?? []).map((b) => ({
        id: b.id,
        court: b.court,
        date: b.date,
        start: b.start_time,
        end: b.end_time,
        type: b.type as BookingType,
        name: b.name,
        phone: b.phone ?? undefined,
        notes: b.notes ?? undefined,
      })),
      media: (media.data ?? []).map((m) => ({
        id: m.id,
        studentId: m.student_id,
        kind: m.kind as MediaKind,
        title: m.title,
        comment: m.comment ?? "",
        createdAt: m.created_at,
        fileName: m.file_name,
        mimeType: m.mime_type ?? "",
        size: Number(m.size),
        coachId: m.coach_id ?? undefined,
      })),
      clubHours: DEFAULT_CLUB_HOURS.map((d) => {
        const row = (clubHours.data ?? []).find((h) => h.weekday === d.weekday);
        return row ? { weekday: row.weekday, open: row.open_time, close: row.close_time, closed: row.closed } : d;
      }),
      materials: (materials.data ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        category: m.category as MaterialCategory,
        quantity: m.quantity,
        unitCost: Number(m.unit_cost),
        purchaseDate: m.purchase_date,
        supplier: m.supplier ?? "",
        notes: m.notes ?? "",
      })),
      materialBudgets: (budgets.data ?? []).map((b) => ({ month: b.month, amount: Number(b.amount) })),
    });

    setHydrated(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const api = useMemo<StoreApi>(() => {
    const currentCoach = () => coachId;
    return {
      data,
      hydrated,
      loading,
      role,
      isAdmin: role === "admin",
      coachId,
      userName,
      email,
      refresh,
      signOut: async () => {
        await supabase.auth.signOut();
      },
      addStudent: async (input) => {
        const { data: row, error } = await supabase
          .from("students")
          .insert({
            name: input.name,
            phone: input.phone,
            email: input.email,
            enrolled_at: input.enrolledAt,
            payment_status: input.paymentStatus,
            plan: input.plan,
            level: input.level,
          })
          .select()
          .single();
        if (error) throw error;
        await supabase.from("payments").insert({
          student_id: row.id,
          month: monthKey(),
          amount: PLAN_PRICES[input.plan],
          paid: input.paymentStatus === "pagado",
          paid_at: input.paymentStatus === "pagado" ? todayKey() : null,
        });
        await refresh();
        return {
          ...input,
          id: row.id,
          active: true,
          attendance: [],
          notes: [],
        };
      },
      updateStudent: async (id, patch) => {
        const payload: Database["public"]["Tables"]["students"]["Update"] = {};
        if (patch.name !== undefined) payload["name"] = patch.name;
        if (patch.phone !== undefined) payload["phone"] = patch.phone;
        if (patch.email !== undefined) payload["email"] = patch.email;
        if (patch.level !== undefined) payload["level"] = patch.level;
        if (patch.plan !== undefined) payload["plan"] = patch.plan;
        if (patch.active !== undefined) payload["active"] = patch.active;
        if (patch.paymentStatus !== undefined) payload["payment_status"] = patch.paymentStatus;
        const { error } = await supabase.from("students").update(payload).eq("id", id);
        if (error) throw error;
        await refresh();
      },
      setStudentPhoto: async (id, file) => {
        const oldPath = data.students.find((s) => s.id === id)?.photoPath;
        let newPath: string | null = null;
        if (file) {
          newPath = await uploadMediaFile(id, file, `avatar-${Date.now()}.jpg`);
        }
        const { error } = await supabase.from("students").update({ photo_path: newPath }).eq("id", id);
        if (error) {
          if (newPath) await removeMediaFile(newPath);
          throw error;
        }
        if (oldPath && oldPath !== newPath) await removeMediaFile(oldPath);
        await refresh();
      },
      deleteStudent: async (id) => {
        const student = data.students.find((s) => s.id === id);
        const paths = data.media
          .filter((m) => m.studentId === id)
          .map((m) => mediaPathOf(m.id))
          .filter((p): p is string => Boolean(p));
        if (student?.photoPath) paths.push(student.photoPath);

        // Quitar al alumno de las clases donde esté inscrito
        for (const cls of data.classes.filter((c) => c.studentIds.includes(id))) {
          const attendance = { ...cls.attendance };
          delete attendance[id];
          const { error } = await supabase
            .from("classes")
            .update({ student_ids: cls.studentIds.filter((sid) => sid !== id), attendance })
            .eq("id", cls.id);
          if (error) throw error;
        }

        for (const table of ["attendance", "media", "payments", "progress_notes", "progress_summaries"] as const) {
          const { error } = await supabase.from(table).delete().eq("student_id", id);
          if (error) throw error;
        }

        const { error } = await supabase.from("students").delete().eq("id", id);
        if (error) throw error;

        for (const path of paths) {
          await removeMediaFile(path).catch(() => undefined);
        }
        await refresh();
      },

      addNote: async (studentId, note) => {
        const { error } = await supabase.from("progress_notes").insert({
          student_id: studentId,
          coach_id: note.coachId || currentCoach(),
          date: note.date,
          text: note.text,
        });
        if (error) throw error;
        await refresh();
      },
      addCoach: async (input) => {
        const { data: row, error } = await supabase
          .from("coaches")
          .insert({ name: input.name, phone: input.phone, email: input.email, specialty: input.specialty })
          .select()
          .single();
        if (error) throw error;
        await refresh();
        return { ...input, id: row.id };
      },
      addClass: async (input) => {
        const { error } = await supabase.from("classes").insert({
          date: input.date,
          time: input.time,
          duration_min: input.durationMin,
          court: input.court,
          coach_id: input.coachId || null,
          level: input.level,
          student_ids: input.studentIds,
          attendance: {},
        });
        if (error) throw error;
        await refresh();
      },
      updateClass: async (id, patch) => {
        const payload: Database["public"]["Tables"]["classes"]["Update"] = {};
        if (patch.date !== undefined) payload["date"] = patch.date;
        if (patch.time !== undefined) payload["time"] = patch.time;
        if (patch.durationMin !== undefined) payload["duration_min"] = patch.durationMin;
        if (patch.court !== undefined) payload["court"] = patch.court;
        if (patch.coachId !== undefined) payload["coach_id"] = patch.coachId;
        if (patch.level !== undefined) payload["level"] = patch.level;
        if (patch.studentIds !== undefined) payload["student_ids"] = patch.studentIds;
        if (patch.attendance !== undefined) payload["attendance"] = patch.attendance;
        const { error } = await supabase.from("classes").update(payload).eq("id", id);
        if (error) throw error;
        await refresh();
      },
      deleteClass: async (id) => {
        const { error } = await supabase.from("classes").delete().eq("id", id);
        if (error) throw error;
        await refresh();
      },
      markAttendance: async (classId, studentId, present) => {
        const cls = data.classes.find((c) => c.id === classId);
        if (!cls) return;
        const attendance = { ...cls.attendance, [studentId]: present };
        const { error } = await supabase.from("classes").update({ attendance }).eq("id", classId);
        if (error) throw error;
        await supabase.from("attendance").delete().eq("class_id", classId).eq("student_id", studentId);
        const { error: insErr } = await supabase
          .from("attendance")
          .insert({ class_id: classId, student_id: studentId, date: cls.date, present });
        if (insErr) throw insErr;
        await refresh();
      },
      setPaid: async (studentId, paid) => {
        const month = monthKey();
        const student = data.students.find((s) => s.id === studentId);
        const existing = data.payments.find((p) => p.studentId === studentId && p.month === month);
        if (existing) {
          const { error } = await supabase
            .from("payments")
            .update({ paid, paid_at: paid ? todayKey() : null })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("payments").insert({
            student_id: studentId,
            month,
            amount: student ? PLAN_PRICES[student.plan] : 0,
            paid,
            paid_at: paid ? todayKey() : null,
          });
          if (error) throw error;
        }
        const { error: sErr } = await supabase
          .from("students")
          .update({ payment_status: paid ? "pagado" : "pendiente" })
          .eq("id", studentId);
        if (sErr) throw sErr;
        await refresh();
      },
      setClubHours: async (hours) => {
        const { error } = await supabase.from("club_hours").upsert(
          hours.map((h) => ({
            weekday: h.weekday,
            open_time: h.open,
            close_time: h.close,
            closed: h.closed,
          })),
          { onConflict: "weekday" },
        );
        if (error) throw error;
        await refresh();
      },
      addBooking: async (input) => {
        const { error } = await supabase.from("bookings").insert({
          court: input.court,
          date: input.date,
          start_time: input.start,
          end_time: input.end,
          type: input.type,
          name: input.name,
          phone: input.phone ?? null,
          notes: input.notes ?? null,
        });
        if (error) throw error;
        await refresh();
      },
      deleteBooking: async (id) => {
        const { error } = await supabase.from("bookings").delete().eq("id", id);
        if (error) throw error;
        await refresh();
      },
      addMedia: async (input, file) => {
        const path = await uploadMediaFile(input.studentId, file, input.fileName);
        const { error } = await supabase.from("media").insert({
          student_id: input.studentId,
          coach_id: currentCoach(),
          kind: input.kind,
          title: input.title,
          comment: input.comment,
          storage_path: path,
          file_name: input.fileName,
          mime_type: input.mimeType,
          size: input.size,
        });
        if (error) {
          await removeMediaFile(path);
          throw error;
        }
        await refresh();
      },
      updateMedia: async (id, patch) => {
        const payload: Database["public"]["Tables"]["media"]["Update"] = {};
        if (patch.title !== undefined) payload["title"] = patch.title;
        if (patch.comment !== undefined) payload["comment"] = patch.comment;
        const { error } = await supabase.from("media").update(payload).eq("id", id);
        if (error) throw error;
        await refresh();
      },
      deleteMedia: async (id) => {
        const path = mediaPaths.get(id);
        const { error } = await supabase.from("media").delete().eq("id", id);
        if (error) throw error;
        if (path) await removeMediaFile(path);
        await refresh();
      },
    };
  }, [data, hydrated, loading, role, coachId, userName, email, refresh]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
