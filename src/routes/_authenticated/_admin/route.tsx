import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/_admin")({
  component: AdminOnly,
});

function AdminOnly() {
  const { loading, isAdmin } = useStore();

  if (loading) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-sm py-16 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-warning/15 text-warning">
          <ShieldAlert className="size-6" />
        </span>
        <h1 className="mt-4 text-lg font-semibold">Sección solo para administradores</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Como profesor puedes ver tus clases del día y las fichas de tus alumnos.
        </p>
        <Link to="/mis-clases" className="mt-5 inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Ir a mis clases
        </Link>
      </div>
    );
  }

  return <Outlet />;
}
