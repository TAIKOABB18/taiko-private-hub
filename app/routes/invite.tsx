import { Form, useLoaderData } from "react-router";
import LockKeyhole from "lucide-react/dist/esm/icons/lock-keyhole.js";
import Link2 from "lucide-react/dist/esm/icons/link-2.js";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle.js";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { Route } from "./+types/invite";

function store(context: Route.LoaderArgs["context"]) { const namespace = context.cloudflare.env.ITEMS; return namespace.get(namespace.idFromName("hub")); }
export async function loader({ params, context }: Route.LoaderArgs) { const invite = await store(context).getInvite(params.token ?? ""); if (!invite) throw new Response("Invitación no válida o revocada", { status: 404 }); return { invite }; }
export function meta() { return [{ title: "TAIKO PRIVATE HUB · Invitación" }]; }
export default function InvitePage() { const { invite } = useLoaderData<typeof loader>(); return <main className="min-h-svh bg-[#020b17] px-5 py-10 text-white"><div className="mx-auto grid w-full max-w-xl gap-8"><header><Badge className="mb-4 bg-blue-600 text-white"><LockKeyhole className="size-3" /> Acceso privado</Badge><h1 className="text-5xl font-bold tracking-tight">Entrar con invitación</h1><p className="mt-3 text-lg text-slate-400">Has sido invitado a un espacio privado. Completa tus datos para entrar únicamente al proyecto autorizado.</p></header><Card className="border-slate-700 bg-slate-900"><CardHeader><CardTitle className="text-white">Crear acceso</CardTitle><CardDescription className="text-slate-400">Invitación: {invite.label}</CardDescription></CardHeader><CardContent className="grid gap-5"><Form method="post" className="grid gap-4"><input type="hidden" name="intent" value="register" /><div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required className="border-slate-700 bg-slate-950 text-white" placeholder="tu@email.com" /></div><div className="grid gap-2"><Label htmlFor="name">Nombre</Label><Input id="name" name="name" required className="border-slate-700 bg-slate-950 text-white" placeholder="Tu nombre" /></div><div className="grid gap-2"><Label htmlFor="password">Contraseña</Label><Input id="password" name="password" type="password" minLength={12} required className="border-slate-700 bg-slate-950 text-white" placeholder="Mínimo 12 caracteres" /></div><Button type="submit" className="bg-blue-600"><Link2 className="size-4" /> Crear cuenta y entrar</Button></Form><div className="flex items-start gap-3 rounded-xl bg-blue-950/50 p-4 text-sm text-blue-100"><MessageCircle className="mt-0.5 size-4" /><p>El registro público está cerrado. Esta cuenta solo obtiene acceso mediante esta invitación válida.</p></div></CardContent></Card></div></main>; }
export async function action() { return { ok: false, error: "invitation_registration_requires_fastify_api" }; }
