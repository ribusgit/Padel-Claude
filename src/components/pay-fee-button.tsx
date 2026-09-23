import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePaddleCheckout } from "@/hooks/use-paddle-checkout";
import { PLAN_PRICES, monthKey, type Plan } from "@/lib/padel";

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
  iconOnly?: boolean;
  className?: string;
}

/** Abre el pago en línea de la cuota del mes en curso del alumno. */
export function PayFeeButton({ studentId, studentName, plan, email, iconOnly, className }: PayFeeButtonProps) {
  const { openCheckout, loading } = usePaddleCheckout();
  const amount = PLAN_PRICES[plan];

  const pay = () => {
    void openCheckout({
      priceId: PRICE_IDS[plan],
      ...(email ? { customerEmail: email } : {}),
      customData: { studentId, month: monthKey(), studentName },
      successUrl: `${window.location.origin}/alumnos/${studentId}?pago=ok`,
    }).catch(() => toast.error("No se pudo abrir el pago. Inténtalo de nuevo."));
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
