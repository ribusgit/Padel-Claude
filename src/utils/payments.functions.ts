import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const env = z.enum(["sandbox", "live"]);
const priceId = z.string().regex(/^[a-z0-9_-]{1,80}$/i);

export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ priceId, environment: env }).parse(data))
  .handler(async ({ data }) => {
    const { gatewayFetch } = await import("@/lib/paddle.server");
    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const result = (await response.json()) as { data?: Array<{ id: string }> };
    if (!result.data?.length) throw new Error("Price not found");
    return result.data[0]!.id;
  });

interface PaddlePriceRow {
  id: string;
  product_id: string;
  name?: string;
  unit_price?: { amount?: string; currency_code?: string };
}

/**
 * Devuelve un precio de Paddle que cobra exactamente la cuota editable actual.
 * Si el precio base del plan ya cobra ese importe se reutiliza; si el
 * administrador cambió la tarifa, se crea un precio nuevo con ese importe.
 */
export const ensureFeePrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ priceId, amountEur: z.number().min(0.7).max(1000), environment: env }).parse(data),
  )
  .handler(async ({ data }) => {
    const { gatewayFetch } = await import("@/lib/paddle.server");
    const cents = Math.round(data.amountEur * 100);
    if (!Number.isFinite(cents) || cents < 70) throw new Error("Importe no válido");

    const listRes = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const list = (await listRes.json()) as { data?: PaddlePriceRow[] };
    const base = list.data?.[0];
    if (!base) throw new Error("Precio base no encontrado");

    if (base.unit_price?.amount === String(cents)) return base.id;

    const createRes = await gatewayFetch(data.environment, "/prices", {
      method: "POST",
      body: JSON.stringify({
        product_id: base.product_id,
        name: base.name ?? "Cuota mensual",
        unit_price: { currency_code: base.unit_price?.currency_code ?? "EUR", amount: String(cents) },
        quantity: { minimum: 1, maximum: 1 },
      }),
    });
    if (!createRes.ok) throw new Error(`No se pudo crear el precio (${createRes.status})`);
    const created = (await createRes.json()) as { data?: { id: string } };
    if (!created.data?.id) throw new Error("No se pudo crear el precio");
    return created.data.id;
  });
