import { useState } from "react";
import { useNavigate } from "react-router";

export function meta() {
  return [{ title: "TAIKO PRIVATE HUB · Acceso" }];
}

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/v1/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string; user?: { role?: string } };
      if (!response.ok) throw new Error(body.error ?? "No se pudo iniciar sesión.");
      navigate(body.user?.role === "OWNER" || body.user?.role === "ADMIN" ? "/" : "/user");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-svh bg-[#020b17] p-6 text-white">
      <div className="mx-auto grid max-w-md gap-8 pt-16">
        <header><h1 className="text-3xl font-bold">TAIKO PRIVATE HUB</h1><p className="mt-2 text-slate-400">Acceso seguro</p></header>
        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="mb-4 text-xl font-semibold">Iniciar sesión</h2>
          <form onSubmit={submit} className="grid gap-3">
            <input value={email} onChange={(event) => setEmail(event.target.value)} name="email" type="email" required autoComplete="email" placeholder="Email" className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-white" />
            <input value={password} onChange={(event) => setPassword(event.target.value)} name="password" type="password" required autoComplete="current-password" placeholder="Contraseña" className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-white" />
            <button disabled={loading} className="rounded-lg bg-violet-600 p-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Comprobando…" : "Entrar"}</button>
          </form>
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
        </section>
      </div>
    </main>
  );
}
