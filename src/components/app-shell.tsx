import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CalendarClock,
  GraduationCap,
  Wallet,
  LandPlot,
  LogOut,
  Clipboard,
  MessageCircle,
  Package,
  PenTool,
  Sparkles,
  Dumbbell,
  ListChecks,
  Image,

  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

type NavTo =
  | "/"
  | "/panel"
  | "/alumnos"
  | "/calendario"
  | "/horarios"
  | "/reservas"
  | "/profesores"
  | "/pagos"
  | "/material"
  | "/mis-clases"
  | "/mensajes"
  | "/informes"
  | "/pizarra"
  | "/pista"
  | "/ejercicios"
  | "/graficos"
  | "/mi-calendario";
type NavItem = { to: NavTo; label: string; icon: LucideIcon };

const ADMIN_NAV: NavItem[] = [
  { to: "/panel", label: "Panel", icon: LayoutDashboard },
  { to: "/alumnos", label: "Alumnos", icon: Users },
  { to: "/calendario", label: "Clases", icon: CalendarDays },
  { to: "/pista", label: "Pista", icon: Dumbbell },
  { to: "/ejercicios", label: "Ejercicios", icon: ListChecks },
  { to: "/graficos", label: "Gráficos", icon: Image },
  { to: "/horarios", label: "Horarios", icon: CalendarClock },
  { to: "/reservas", label: "Pistas", icon: LandPlot },
  { to: "/pizarra", label: "Pizarra", icon: PenTool },
  { to: "/profesores", label: "Profesores", icon: GraduationCap },
  { to: "/pagos", label: "Pagos", icon: Wallet },
  { to: "/material", label: "Material", icon: Package },
  { to: "/mensajes", label: "Mensajes", icon: MessageCircle },
  { to: "/informes", label: "Informes", icon: Sparkles },
];


const COACH_NAV: NavItem[] = [
  { to: "/panel", label: "Inicio", icon: LayoutDashboard },
  { to: "/mis-clases", label: "Mis clases", icon: Clipboard },
  { to: "/mi-calendario", label: "Mi calendario", icon: CalendarDays },
  { to: "/pista", label: "Pista", icon: Dumbbell },
  { to: "/ejercicios", label: "Ejercicios", icon: ListChecks },
  { to: "/graficos", label: "Gráficos", icon: Image },
  { to: "/alumnos", label: "Alumnos", icon: Users },
  { to: "/pizarra", label: "Pizarra", icon: PenTool },
];

const STUDENT_NAV: NavItem[] = [{ to: "/panel", label: "Mi portal", icon: Wallet }];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground glow-lime">
        <span className="size-3.5 rounded-full border-2 border-primary-foreground" />
      </span>
      <div className="leading-tight">
        <p className="font-display text-base font-bold tracking-tight">Padel Time</p>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Gestión</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role, isAdmin, userName, email, signOut } = useStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const nav = isAdmin ? ADMIN_NAV : role === "coach" ? COACH_NAV : STUDENT_NAV;

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen court-grid">
      <PaymentTestModeBanner />
      {/* Barra lateral en escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
        <Logo />
        <nav className="mt-8 flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(to)
                  ? "bg-primary text-primary-foreground glow-lime"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2 border-t border-sidebar-border pt-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{userName || email}</p>
            <p className="text-[11px] uppercase tracking-widest text-primary">
              {role === "admin" ? "Administrador" : role === "coach" ? "Profesor" : role === "alumno" ? "Alumno" : "Sin permisos"}
            </p>
          </div>
          <button
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" /> Salir
          </button>
        </div>
      </aside>

      {/* Barra superior en móvil */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:hidden">
        <Logo />
        <button
          onClick={() => void handleSignOut()}
          aria-label="Salir"
          className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 md:pl-68 md:pr-8 md:pt-8 md:pb-12">{children}</main>

      {/* Navegación inferior en móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-sidebar/95 backdrop-blur md:hidden">
        <ul className="grid auto-cols-fr grid-flow-col overflow-x-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  isActive(to) ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-9 items-center justify-center rounded-full transition-colors",
                    isActive(to) && "bg-primary/15",
                  )}
                >
                  <Icon className="size-[18px]" />
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
