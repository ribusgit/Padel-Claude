import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppLogEntry {
  studentId?: string | undefined;
  recipientName: string;
  phone?: string | undefined;
  kind: string;
  body: string;
}

/** Registra en el historial un mensaje de WhatsApp enviado desde la app. */
export async function logWhatsAppSent(entry: WhatsAppLogEntry) {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("whatsapp_messages").insert({
    direction: "enviado",
    student_id: entry.studentId ?? null,
    recipient_name: entry.recipientName,
    phone: entry.phone ?? "",
    kind: entry.kind,
    body: entry.body,
    sent_by: auth.user?.id ?? null,
  });
  if (error) console.error("No se pudo registrar el mensaje de WhatsApp", error);
}

export interface WhatsAppLogRow {
  id: string;
  direction: "enviado" | "recibido";
  studentId: string | null;
  recipientName: string;
  phone: string;
  kind: string;
  body: string;
  createdAt: string;
}

/** Historial de mensajes de WhatsApp, del más reciente al más antiguo. */
export async function fetchWhatsAppLog(): Promise<WhatsAppLogRow[]> {
  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    direction: r.direction as "enviado" | "recibido",
    studentId: r.student_id,
    recipientName: r.recipient_name,
    phone: r.phone ?? "",
    kind: r.kind ?? "",
    body: r.body ?? "",
    createdAt: r.created_at,
  }));
}
