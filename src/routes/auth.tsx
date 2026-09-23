import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso — Escuela de Pádel" },
      { name: "description", content: "Entra con tu cuenta de administrador o profesor de la escuela de pádel." },
      { property: "og:title", content: "Acceso — Escuela de Pádel" },
      { property: "og:description", content: "Entra con tu cuenta de administrador o profesor de la escuela de pádel." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "bootstrap" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        void navigate({ to: "/panel", replace: true });
        return;
      }
      const { data } = await supabase.rpc("is_admin_claimed" as never);
      setMode(data === false ? "bootstrap" : "login");
    })();
  }, [navigate]);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error("Correo o contraseña incorrectos");
      return;
    }
    void navigate({ to: "/panel", replace: true });
  };

  const createAdmin = async () => {
    if (name.trim().length < 2) {
      toast.error("Escribe tu nombre");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: name.trim() } },
    });
    if (error || !data.user) {
      setBusy(false);
      toast.error(error?.message ?? "No se pudo crear la cuenta");
      return;
    }
    if (!data.session) {
      await supabase.auth.signInWithPassword({ email: email.trim(), password });
    }
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      setBusy(false);
      toast.error("Revisa tu correo para confirmar la cuenta");
      return;
    }
    const { error: roleError } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (roleError) {
      setBusy(false);
      toast.error("La escuela ya tiene un administrador. Pídele acceso.");
      return;
    }
    await supabase.from("profiles").upsert({ id: userId, full_name: name.trim() });
    await supabase.from("school_state").update({ admin_claimed: true }).eq("id", true);
    setBusy(false);
    toast.success("Cuenta de administrador creada");
    void navigate({ to: "/panel", replace: true });
  };

  return (
    <div className="court-grid flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground glow-lime">
            <span className="size-4 rounded-full border-2 border-primary-foreground" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold">Escuela de Pádel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "bootstrap"
              ? "Crea la cuenta del propietario de la escuela"
              : "Entra con tu cuenta de administrador o profesor"}
          </p>
        </div>

        <form
          className="space-y-4 rounded-2xl border border-border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void (mode === "bootstrap" ? createAdmin() : signIn());
          }}
        >
          {mode === "bootstrap" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Tu nombre</Label>
              <Input id="name" className="h-11" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "bootstrap" ? "new-password" : "current-password"}
              className="h-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <Button type="submit" size="lg" className="h-12 w-full" disabled={busy || mode === null}>
            {busy ? "Un momento…" : mode === "bootstrap" ? "Crear cuenta de administrador" : "Entrar"}
          </Button>
          {mode === "login" && (
            <p className="text-center text-xs text-muted-foreground">
              Las cuentas de profesor las crea el administrador de la escuela.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
