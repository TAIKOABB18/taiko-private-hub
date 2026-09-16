import { Form, redirect, useActionData } from "react-router";
import bcrypt from "bcryptjs";
import type { ItemStore } from "../../workers/item-store";

const OWNER_EMAIL="tramiteshbc@gmail.com";
const COOKIE="taiko_session";
const SESSION_DAYS=30;
type AppContext={cloudflare:{env:{ITEMS:DurableObjectNamespace<ItemStore>};ctx:ExecutionContext}};
type ActionResult={ok:false;error:string};

function store(context:AppContext){const ns=context.cloudflare.env.ITEMS;return ns.get(ns.idFromName("hub"));}
function randomToken(bytes=32){const data=new Uint8Array(bytes);crypto.getRandomValues(data);return Array.from(data,b=>b.toString(16).padStart(2,"0")).join("");}
async function sha256(value:string){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");}
function sessionCookie(token:string){return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS*86400}`;}
function validPassword(value:string){return value.length>=12&&value.length<=128;}
async function createSession(hub:DurableObjectStub<ItemStore>,userId:number){const token=randomToken(),expiresAt=new Date(Date.now()+SESSION_DAYS*86400000).toISOString();await hub.createSession(userId,await sha256(token),expiresAt);return token;}

export function meta(){return [{title:"TAIKO PRIVATE HUB · Acceso"}];}
export async function action({request,context}:{request:Request;context:AppContext}):Promise<Response|ActionResult>{
 const form=await request.formData();
 const intent=String(form.get("intent")||"login");
 const email=String(form.get("email")||"").trim().toLowerCase();
 const password=String(form.get("password")||"");
 const name=String(form.get("name")||"").trim();
 const hub=store(context);
 try{
  if(intent==="register"){
   if(email!==OWNER_EMAIL)return {ok:false,error:"Este email no puede registrarse como Administrador."};
   if(!name||!validPassword(password))return {ok:false,error:"Indica tu nombre y una contraseña de 12 a 128 caracteres."};
   const user=await hub.registerOwner(email,name,await bcrypt.hash(password,12));
   const token=await createSession(hub,user.id);
   return redirect("/",{headers:{"Set-Cookie":sessionCookie(token)}});
  }
  const account=await hub.getUserByEmail(email);
  if(!account||!(await bcrypt.compare(password,account.passwordHash)))return {ok:false,error:"Email o contraseña incorrectos."};
  const token=await createSession(hub,account.id);
  return redirect(account.role==="OWNER"?"/":"/user",{headers:{"Set-Cookie":sessionCookie(token)}});
 }catch(error){
  const code=error instanceof Error?error.message:"auth_failed";
  if(code==="email_already_registered")return {ok:false,error:"Este Administrador ya está registrado. Usa Iniciar sesión."};
  return {ok:false,error:code};
 }
}

export default function Auth(){const result=useActionData<ActionResult>();return <main className="min-h-svh bg-[#020b17] p-6 text-white"><div className="mx-auto grid max-w-md gap-8 pt-16"><header><h1 className="text-3xl font-bold">TAIKO PRIVATE HUB</h1><p className="mt-2 text-slate-400">Acceso seguro</p></header><section className="rounded-2xl border border-slate-700 bg-slate-900 p-6"><h2 className="mb-4 text-xl font-semibold">Iniciar sesión</h2><Form method="post" className="grid gap-3"><input type="hidden" name="intent" value="login"/><input name="email" type="email" required autoComplete="email" placeholder="Email" className="rounded-lg border border-slate-700 bg-slate-950 p-3"/><input name="password" type="password" required autoComplete="current-password" placeholder="Contraseña" className="rounded-lg border border-slate-700 bg-slate-950 p-3"/><button className="rounded-lg bg-blue-600 p-3 font-semibold">Entrar</button></Form></section><section className="rounded-2xl border border-slate-700 bg-slate-900 p-6"><h2 className="mb-1 text-xl font-semibold">Registro Administrador</h2><p className="mb-4 text-xs text-slate-400">Reservado exclusivamente a tramiteshbc@gmail.com</p><Form method="post" className="grid gap-3"><input type="hidden" name="intent" value="register"/><input name="name" required autoComplete="name" placeholder="Nombre" className="rounded-lg border border-slate-700 bg-slate-950 p-3"/><input name="email" type="email" required autoComplete="email" defaultValue={OWNER_EMAIL} readOnly className="rounded-lg border border-slate-700 bg-slate-950 p-3"/><input name="password" type="password" minLength={12} maxLength={128} required autoComplete="new-password" placeholder="Contraseña · mínimo 12 caracteres" className="rounded-lg border border-slate-700 bg-slate-950 p-3"/><button className="rounded-lg bg-violet-600 p-3 font-semibold">Registrarme como Administrador</button></Form></section>{result&&!result.ok&&<p role="alert" className="rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">{result.error}</p>}</div></main>;}
