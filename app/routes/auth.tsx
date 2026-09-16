import { Form, useActionData } from "react-router";

type ActionResult={ok:false;error:string};
const OWNER_EMAIL="tramiteshbc@gmail.com";

export function meta(){return [{title:"TAIKO PRIVATE HUB · Acceso"}];}

export async function action({request}:{request:Request}):Promise<ActionResult>{
  // Fallback only. Production forms submit as normal document requests directly
  // to the Worker JSON auth endpoints to avoid React Router turbo-stream decoding.
  const form=await request.formData();
  return {ok:false,error:String(form.get("error")||"Solicitud de autenticación no válida.")};
}

export default function Auth(){
 const result=useActionData<ActionResult>();
 return <main className="min-h-svh bg-[#020b17] p-6 text-white"><div className="mx-auto grid max-w-md gap-8 pt-16">
  <header><h1 className="text-3xl font-bold">TAIKO PRIVATE HUB</h1><p className="mt-2 text-slate-400">Acceso seguro</p></header>
  <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6"><h2 className="mb-4 text-xl font-semibold">Iniciar sesión</h2>
   <form method="post" action="/api/auth/login" className="grid gap-3"><input name="email" type="email" required autoComplete="email" placeholder="Email" className="rounded-lg border border-slate-700 bg-slate-950 p-3"/><input name="password" type="password" required autoComplete="current-password" placeholder="Contraseña" className="rounded-lg border border-slate-700 bg-slate-950 p-3"/><button className="rounded-lg bg-blue-600 p-3 font-semibold">Entrar</button></form>
  </section>
  <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6"><h2 className="mb-1 text-xl font-semibold">Registro Administrador</h2><p className="mb-4 text-xs text-slate-400">Reservado exclusivamente a {OWNER_EMAIL}</p>
   <form method="post" action="/api/auth/owner-register" className="grid gap-3"><input name="name" required autoComplete="name" placeholder="Nombre" className="rounded-lg border border-slate-700 bg-slate-950 p-3"/><input name="email" type="email" required value={OWNER_EMAIL} readOnly className="rounded-lg border border-slate-700 bg-slate-950 p-3"/><input name="password" type="password" minLength={12} maxLength={128} required autoComplete="new-password" placeholder="Contraseña · mínimo 12 caracteres" className="rounded-lg border border-slate-700 bg-slate-950 p-3"/><button className="rounded-lg bg-violet-600 p-3 font-semibold">Registrarme como Administrador</button></form>
  </section>
  {result&&!result.ok&&<p role="alert" className="rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">{result.error}</p>}
 </div></main>;
}
