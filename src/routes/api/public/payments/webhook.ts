import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";
import type { Database } from "@/integrations/supabase/types";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(process.env['SUPABASE_URL']!, process.env['SUPABASE_SERVICE_ROLE_KEY']!);
  }
  return _supabase;
}

/** Marca la cuota del alumno como pagada a partir de una transacción completada. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleTransactionCompleted(data: any) {
  const studentId: string | undefined = data?.customData?.studentId;
  const month: string | undefined = data?.customData?.month;
  if (!studentId || !month) {
    console.warn("transaction.completed sin studentId/month en customData");
    return;
  }

  const rawTotal = data?.details?.totals?.total ?? data?.details?.totals?.grandTotal ?? "0";
  const amount = Number(rawTotal) / 100;
  const paidAt = new Date().toISOString().slice(0, 10);
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("student_id", studentId)
    .eq("month", month)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("payments")
      .update({ paid: true, paid_at: paidAt, method: "tarjeta", ...(amount > 0 ? { amount } : {}) })
      .eq("id", existing['id'] as string);
  } else {
    await supabase
      .from("payments")
      .insert({ student_id: studentId, month, amount, paid: true, paid_at: paidAt, method: "tarjeta" });
  }

  await supabase.from("students").update({ payment_status: "pagado" }).eq("id", studentId);
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.eventType) {
    case EventName.TransactionCompleted:
      await handleTransactionCompleted(event.data);
      break;
    default:
      console.log("Evento no gestionado:", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
