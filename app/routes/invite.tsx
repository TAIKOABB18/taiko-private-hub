import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import LockKeyhole from "lucide-react/dist/esm/icons/lock-keyhole.js";
import Link2 from "lucide-react/dist/esm/icons/link-2.js";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle.js";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function meta() {
  return [{ title: "TAIKO PRIVATE HUB · Invitación" }];
}

export default function InvitePage() {
  const navigate = useNavigate();
  const { token = "" } = useParams();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!token) throw new Error("Invitación no válida.");
      const response = await fetch("/v1/auth/invite-register", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ inviteToken: token, email: email.trim(), name: name.trim(), password }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "No se pudo aceptar la invitación.");
      navigate("/user", { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo aceptar la invitación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-svh bg-[#020b17] px-5 py-10 text-white">
      <div className="mx-auto grid w-full max-w-xl gap-8">
        <header>
          <Badge className="mb-4 bg-blue-600 text-white"><LockKeyhole className="size-3" /> Acceso privado</Badge>
          <h1 className="text-5xl font-bold tracking-tight">Entrar con invitación</h1>
          <p className="mt-3 text-lg text-slate-400">Has sido invitado a un espacio privado. Regístrate una sola vez para acceder únicamente al proyecto autorizado.</p>
        </header>

        <Card className="border-slate-700 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-white">Crear acceso</CardTitle>
            <CardDescription className="text-slate-400">El enlace privado se validará al crear la cuenta.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" className="border-slate-700 bg-slate-950 text-white" placeholder="tu@email.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" className="border-slate-700 bg-slate-950 text-white" placeholder="Tu nombre" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={12} maxLength={128} required autoComplete="new-password" className="border-slate-700 bg-slate-950 text-white" placeholder="Mínimo 12 caracteres" />
              </div>
              <Button type="submit" disabled={loading || !token} className="bg-blue-600 disabled:opacity-60">
                <Link2 className="size-4" /> {loading ? "Validando…" : "Crear cuenta y entrar"}
              </Button>
            </form>

            {error && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}

            <div className="flex items-start gap-3 rounded-xl bg-blue-950/50 p-4 text-sm text-blue-100">
              <MessageCircle className="mt-0.5 size-4" />
              <p>El enlace se consume al crear la cuenta. Después podrás entrar normalmente con tu email y contraseña desde la portada.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
