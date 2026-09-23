import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDownLeft, ArrowUpRight, Info, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { WhatsAppIcon } from "@/components/whatsapp-dialog";
import { Button } from "@/components/ui/button";
import { fetchWhatsAppLog } from "@/lib/whatsapp-log";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_admin/mensajes")({
  head: () => ({
    meta: [
      { title: "Mensajes de WhatsApp · Escuela de Pádel" },
      { name: "description", content: "Historial de recordatorios y avisos de WhatsApp enviados a los alumnos." },
      { property: "og:title", content: "Mensajes de WhatsApp · Escuela de Pádel" },
      { property: "og:description", content: "Seguimiento de los avisos enviados a alumnos por WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["whatsapp-log"],
    queryFn: fetchWhatsAppLog,
  });

  const rows = data ?? [];
  const sent = rows.filter((r) => r.direction === "enviado").length;

  return (
    <>
      <PageHeader
        title="Mensajes de WhatsApp"
        subtitle={`${sent} mensajes enviados desde la app`}
        action={
          <Button variant="secondary" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={cn(isFetching && "animate-spin")} /> Actualizar
          </Button>
        }
      />

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-card p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Aquí se registra cada aviso que envías desde la app. Las respuestas que los alumnos te escriben llegan a tu
          WhatsApp personal: para verlas también aquí haría falta una cuenta de WhatsApp Business con su servicio de
          mensajería conectado.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Cargando historial…</p>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
            <WhatsAppIcon className="size-6" />
          </span>
          <p className="mt-3 text-sm font-semibold">Todavía no has enviado mensajes</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Los recordatorios que envíes desde Alumnos, Horarios o Pagos aparecerán aquí.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold",
                    r.direction === "enviado"
                      ? "bg-[#25D366]/15 text-[#25D366]"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {r.direction === "enviado" ? (
                    <ArrowUpRight className="size-3" />
                  ) : (
                    <ArrowDownLeft className="size-3" />
                  )}
                  {r.direction === "enviado" ? "Enviado" : "Recibido"}
                </span>
                <span className="text-sm font-semibold">{r.recipientName || "Sin nombre"}</span>
                {r.phone && <span className="text-xs text-muted-foreground">{r.phone}</span>}
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {format(parseISO(r.createdAt), "d MMM yyyy · HH:mm", { locale: es })}
                </span>
              </div>
              {r.kind && <p className="mt-1 text-xs uppercase tracking-wider text-primary">{r.kind}</p>}
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{r.body}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
