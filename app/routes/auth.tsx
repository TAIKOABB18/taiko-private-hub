import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Cloud, Eye, EyeOff, KeyRound, Link2, LockKeyhole, Users } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

const OWNER_EMAIL = "tramiteshbc@gmail.com";

type AuthResponse = {
  error?: string;
  user?: { role?: string };
};

export function meta() {
  return [{ title: "TAIKO PRIVATE HUB · Acceso" }];
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-400 to-violet-600 text-xl font-black text-white">V</div>
      <div className="leading-none">
        <strong className="block text-lg tracking-tight text-white">TAIKO</strong>
        <span className="text-[9px] font-semibold tracking-[.24em] text-slate-400">PRIVATE HUB</span>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-blue-400/40 bg-blue-500/10 text-cyan-300">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-slate-400">{text}</p>
      </div>
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const registering = mode === "register";
      const response = await fetch(registering ? "/v1/auth/owner-register" : "/v1/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(
          registering
            ? { name: name.trim(), email: OWNER_EMAIL, password }
            : { email: email.trim(), password },
        ),
      });

      const body = (await response.json().catch(() => ({}))) as AuthResponse;
      if (!response.ok) throw new Error(body.error ?? "No se pudo completar el acceso.");
      navigate(body.user?.role === "OWNER" ? "/" : "/user", { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo completar el acceso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-svh overflow-hidden bg-[#020b17] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_55%,#103e72_0,transparent_32%),radial-gradient(circle_at_15%_20%,#112c59_0,transparent_32%)]" />
      <div className="relative mx-auto flex min-h-svh max-w-7xl flex-col px-6 py-6 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Logo />
          <nav className="hidden gap-8 text-xs text-slate-300 md:flex">
            <span>Privacidad</span><span>Seguridad</span><span>Colaboración</span><span>Control total</span>
          </nav>
          <Button onClick={() => setMode("login")} variant="outline" className="border-slate-600 bg-transparent text-white">Acceder</Button>
        </header>
        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.1fr_.8fr]">
          <section>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[.35em] text-blue-300">Un espacio privado de verdad</p>
            <h1 className="max-w-2xl text-5xl font-bold leading-[1.02] sm:text-7xl">Tu espacio privado.<br />Tus proyectos.<br /><span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">Sin límites.</span></h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-slate-300">Archivos, chat, proyectos y mucho más.<br />Todo en un entorno seguro, privado y bajo tu control.</p>
            <div className="mt-9 grid max-w-lg gap-4 sm:grid-cols-2">
              <Feature icon={<LockKeyhole />} title="Privado por defecto" text="Tus datos, siempre tuyos" />
              <Feature icon={<Users />} title="Colaboración segura" text="Invita, comparte, controla" />
              <Feature icon={<Cloud />} title="Archivos grandes" text="R2 / S3 privado" />
              <Feature icon={<KeyRound />} title="Agente Taiko" text="Tu asistente técnico interno" />
            </div>
          </section>
          <Card className="border-slate-700 bg-slate-900/80 p-2 shadow-2xl shadow-blue-950/40 backdrop-blur">
            <CardHeader className="pb-2 text-center"><CardTitle className="text-2xl text-white">Bienvenido</CardTitle><p className="text-sm text-slate-400">Accede a tu espacio privado</p></CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" onClick={() => { setMode("login"); setError(""); }} className={mode === "login" ? "bg-blue-600" : "bg-slate-800 text-slate-300"}>Iniciar sesión</Button>
                <Button type="button" onClick={() => { setMode("register"); setError(""); }} variant="outline" className={mode === "register" ? "border-blue-500 bg-blue-950/40 text-white" : "border-slate-700 bg-transparent text-slate-300"}>Crear cuenta</Button>
              </div>
              <form onSubmit={submit} className="grid gap-4">
                {mode === "register" && <Input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" placeholder="Tu nombre" className="border-slate-700 bg-slate-950/70 text-white" />}
                <Input value={mode === "register" ? OWNER_EMAIL : email} onChange={(event) => setEmail(event.target.value)} readOnly={mode === "register"} required type="email" autoComplete="email" placeholder="✉  Tu email" className="border-slate-700 bg-slate-950/70 text-white" />
                <div className="relative">
                  <Input value={password} onChange={(event) => setPassword(event.target.value)} required minLength={mode === "register" ? 12 : undefined} maxLength={128} type={showPassword ? "text" : "password"} autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder="♙  Tu contraseña" className="border-slate-700 bg-slate-950/70 pr-10 text-white" />
                  <button type="button" aria-label="Mostrar contraseña" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                </div>
                <Button disabled={loading} className="h-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-60">{loading ? "Comprobando…" : mode === "register" ? "Crear cuenta de administrador" : "Entrar"}{!loading && <ArrowRight className="size-4" />}</Button>
              </form>
              {error && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
              {notice && <p className="rounded-lg border border-blue-900 bg-blue-950/50 p-3 text-sm text-blue-100">{notice}</p>}
              <div className="flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-slate-700" />o<span className="h-px flex-1 bg-slate-700" /></div>
              <Button type="button" onClick={() => setNotice("Abre el enlace privado de invitación que recibiste. Ese enlace contiene el acceso al proyecto autorizado.")} variant="outline" className="border-slate-700 bg-transparent text-white"><Link2 className="size-4" /> Entrar con invitación</Button>
              <p className="text-center text-[11px] leading-5 text-slate-500">Un entorno profesional para proyectos reales.<br />Sin exposición pública.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
