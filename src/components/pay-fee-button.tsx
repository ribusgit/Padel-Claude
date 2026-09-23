import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePaddleCheckout } from "@/hooks/use-paddle-checkout";
import { getPaddleEnvironment } from "@/lib/paddle";
import { monthKey, type Plan } from "@/lib/padel";
import { useStore } from "@/lib/store";
import { ensureFeePrice } from "@/utils/payments.functions";

const PRICE_IDS: Record<Plan, string> = {
  "1x": "cuota_1x",
  "2x": "cuota_2x",
  particular: "cuota_particular",
};

interface PayFeeButtonProps {
  studentId: string;
  studentName: string;
  plan: Plan;
  email?: string;
  /** Mes a cobrar (yyyy-MM); por defecto el mes en curso. */
  month?: string;
  /** Importe explícito (portal del alumno, donde las tarifas no son legibles). */
  amount?: number;
  iconOnly?: boolean;
  className?: string;
}

/** Abre el pago en línea de la cuota del alumno con la tarifa editable actual. */
export function PayFeeButton({ studentId, studentName, plan, email, month, amount: amountProp, iconOnly, className }: PayFeeButtonProps) {
  const { openCheckout, loading } = usePaddleCheckout();
  const { data } = useStore();
  const amount = amountProp ?? data.feePlans[plan];
  const targetMonth = month ?? monthKey();

  const pay = () => {
    void (async () => {
      // Garantiza que el cobro usa la tarifa editable actual, no la original.
      const paddlePriceId = await ensureFeePrice({
        data: { priceId: PRICE_IDS[plan], amountEur: amount, environment: getPaddleEnvironment() },
      });
      await openCheckout({
        priceId: PRICE_IDS[plan],
        paddlePriceId,
        ...(email ? { customerEmail: email } : {}),
        customData: { studentId, month: targetMonth, studentName },
        successUrl: `${window.location.origin}/alumnos/${studentId}?pago=ok`,
      });
    })().catch(() => toast.error("No se pudo abrir el pago. Inténtalo de nuevo."));
  };

  return (
    <Button
      variant={iconOnly ? "ghost" : "default"}
      size={iconOnly ? "icon" : "sm"}
      onClick={pay}
      disabled={loading}
      aria-label={`Pagar la cuota de ${studentName} (${amount} €)`}
      className={className}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
      {!iconOnly && <span>Pagar {amount} €</span>}
    </Button>
  );
}
