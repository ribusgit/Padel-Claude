import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, LandPlot, LineChart, Users, Wallet, Sparkles } from "lucide-react";
import heroCourt from "@/assets/home-padel.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Escuela de Pádel — Gestión del club, clases y alumnos" },
      {
        name: "description",
        content:
          "La escuela de pádel, en una sola pantalla: alumnos, clases, pistas, cuotas y seguimiento técnico de cada jugador.",
      },
      { property: "og:title", content: "Escuela de Pádel — Gestión del club, clases y alumnos" },
      {
        property: "og:description",
        content:
          "La escuela de pádel, en una sola pantalla: alumnos, clases, pistas, cuotas y seguimiento técnico de cada jugador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const FEATURES = [
  { icon: Users, title: "Alumnos y niveles", text: "Fichas completas con nivel, tarifa, asistencia y notas de cada profesor." },
  { icon: CalendarDays, title: "Clases y horarios", text: "Cuadrante semanal con pista, profesor y un máximo de 4 alumnos por clase." },
  { icon: LandPlot, title: "Pistas del club", text: "Reservas y alquiler libre según el horario real, sin duplicidades." },
  { icon: Wallet, title: "Cuotas y Bizum", text: "Cobros con tarjeta o Bizum y deuda actualizada al instante." },
  { icon: Sparkles, title: "Análisis de técnica", text: "Vídeos de cada golpe con informe automático y deberes para el alumno." },
  { icon: LineChart, title: "Evolución", text: "Resúmenes de progreso para ver cómo mejora cada jugador mes a mes." },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 md:px-10">
        <span className="font-display text-lg font-extrabold tracking-tight text-white">
          Escuela de <span className="text-primary">Pádel</span>
        </span>
        <Link
          to="/auth"
          className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
        >
          Entrar
        </Link>
      </header>

      <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden">
        <img
          src={heroCourt}
          alt="Pista de pádel iluminada al anochecer"
          width={1600}
          height={1008}
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/60 to-background/10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background/80 via-background/30 to-transparent" />

        <div className="mx-auto w-full max-w-5xl px-5 py-24 md:px-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> Gestión del club
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
            Toda tu escuela de pádel,
            <span className="block text-primary">dentro de la pista.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
            Alumnos, clases, pistas, cuotas y el progreso técnico de cada jugador. Los profesores lo llevan en el móvil;
            tú lo controlas todo desde un único panel.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-display text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02]"
            >
              Entrar
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <span className="text-sm text-white/55">Acceso para dirección, profesores y alumnos</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 md:px-10 md:py-24">
        <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Lo que hay dentro</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
          Todo lo que la escuela necesita en el día a día, sin papeles ni hojas de cálculo.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-5 px-5 py-14 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">¿Listo para la próxima clase?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Entra con tu cuenta y continúa donde lo dejaste.</p>
          </div>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Entrar <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8 text-center text-xs text-muted-foreground md:px-10">
        Escuela de Pádel · Gestión de clases, pistas y alumnos
      </footer>
    </div>
  );
}
