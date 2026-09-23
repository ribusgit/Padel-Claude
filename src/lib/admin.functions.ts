import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  fullName: z.string().min(2).max(80),
  coachId: z.string().uuid(),
});

/** Crea la cuenta de acceso de un profesor. Solo para administradores. */
export const createCoachAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: adminRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRow) throw new Error("Solo un administrador puede crear cuentas de profesor");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) throw new Error(error?.message ?? "No se pudo crear la cuenta");

    const userId = created.user.id;
    const { error: pErr } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, full_name: data.fullName, coach_id: data.coachId });
    if (pErr) throw new Error(pErr.message);
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "coach" }, { onConflict: "user_id,role" });
    if (rErr) throw new Error(rErr.message);

    return { ok: true as const, userId };
  });

const studentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  fullName: z.string().min(2).max(80),
  studentId: z.string().uuid(),
});

/** Crea la cuenta de acceso de un alumno (portal propio). Solo para administradores. */
export const createStudentAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => studentSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: adminRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRow) throw new Error("Solo un administrador puede crear cuentas de alumno");

    const { data: student } = await context.supabase
      .from("students")
      .select("id, name")
      .eq("id", data.studentId)
      .maybeSingle();
    if (!student) throw new Error("Alumno no encontrado");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) throw new Error(error?.message ?? "No se pudo crear la cuenta");

    const userId = created.user.id;
    const { error: pErr } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, full_name: data.fullName, student_id: data.studentId });
    if (pErr) throw new Error(pErr.message);
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "alumno" }, { onConflict: "user_id,role" });
    if (rErr) throw new Error(rErr.message);

    return { ok: true as const, userId };
  });
