import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router";
import Archive from "lucide-react/dist/esm/icons/archive.js";
import Bell from "lucide-react/dist/esm/icons/bell.js";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down.js";
import Cloud from "lucide-react/dist/esm/icons/cloud.js";
import FileText from "lucide-react/dist/esm/icons/file-text.js";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban.js";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle.js";
import Plus from "lucide-react/dist/esm/icons/plus.js";
import Search from "lucide-react/dist/esm/icons/search.js";
import Send from "lucide-react/dist/esm/icons/send.js";
import Settings from "lucide-react/dist/esm/icons/settings.js";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check.js";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal.js";
import Upload from "lucide-react/dist/esm/icons/upload.js";
import Users from "lucide-react/dist/esm/icons/users.js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

type User = { id: number; email: string; name: string; role: "OWNER" | "COLLABORATOR" };
type Project = { id: number; name: string; description: string; status: "active" | "archived"; createdAt?: string };
type Invite = { id: number; projectId: number; label: string; token: string; active: number; createdAt?: string };
type VaultFile = { id: number; projectId: number; name: string; mime: string; size: number; deleted?: number; updatedAt?: string };
type AgentJob = { id: number; projectId: number | null; kind: string; status: string; input?: string; output?: string | null; error?: string | null; createdAt?: string };
type Message = { id: number; projectId: number; author: "admin" | "guest"; body: string; createdAt: string };

type ApiError = { error?: string };

export function meta() {
  return [{ title: "TAIKO PRIVATE HUB" }, { name: "description", content: "Espacio privado para proyectos, archivos y colaboración." }];
}

const navOwner = ["Dashboard", "Proyectos", "Personas", "Invitaciones", "Chat Privado", "Archivos", "Subidas", "Compartidos", "Agente Taiko", "Actividad", "Papelera"];
const navAdmin = ["Usuarios y Roles", "Configuración IA", "Integraciones", "Allowlist", "Almacenamiento", "Seguridad", "Backups", "Sistema"];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", ...init });
  const body = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
  return body;
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

function IconFor({ name }: { name: string }) {
  const props = { className: "size-4" };
  if (name.includes("Proyecto")) return <FolderKanban {...props} />;
  if (name.includes("Person") || name.includes("Usuario")) return <Users {...props} />;
  if (name.includes("Chat")) return <MessageCircle {...props} />;
  if (name.includes("Archivo") || name.includes("Papelera")) return <FileText {...props} />;
  if (name.includes("Subida")) return <Upload {...props} />;
  if (name.includes("Agente")) return <Cloud {...props} />;
  if (name.includes("Seguridad")) return <ShieldCheck {...props} />;
  if (name.includes("Configur") || name.includes("Sistema")) return <Settings {...props} />;
  return <SlidersHorizontal {...props} />;
}

function Status({ children = "CONECTADO" }: { children?: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300"><span className="size-1.5 rounded-full bg-emerald-500" />{children}</span>;
}

function Sidebar({ active, setActive }: { active: string; setActive: (value: string) => void }) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-800 bg-[#061321] p-4 lg:block">
      <Logo />
      <div className="mt-9 space-y-1">
        {navOwner.map((item) => (
          <button key={item} onClick={() => setActive(item)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition ${active === item ? "bg-blue-600 text-white shadow-lg shadow-blue-950" : "text-slate-300 hover:bg-slate-800"}`}>
            <IconFor name={item} />{item}{item === "Agente Taiko" && <span className="ml-auto rounded bg-violet-600 px-1 text-[8px]">IA</span>}
          </button>
        ))}
      </div>
      <p className="mb-2 mt-8 border-t border-slate-800 pt-6 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Administración</p>
      <div className="space-y-1">
        {navAdmin.map((item) => (
          <button key={item} onClick={() => setActive(item)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs ${active === item ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}>
            <IconFor name={item} />{item}
          </button>
        ))}
      </div>
    </aside>
  );
}

function Metric({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return (
    <Card className="border-slate-800 bg-[#0b1b2b]">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="grid size-10 place-items-center rounded-xl bg-blue-600/20 text-blue-300">{icon}</div>
        <div><p className="text-[11px] text-slate-400">{label}</p><p className="text-xl font-semibold text-white">{value}</p><p className="text-[10px] text-slate-500">{note}</p></div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [active, setActive] = useState("Dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [inviteLabel, setInviteLabel] = useState("Colaborador");
  const [messageText, setMessageText] = useState("");
  const [agentInput, setAgentInput] = useState("");
  const [agentOutput, setAgentOutput] = useState("");

  async function refresh() {
    setError("");
    try {
      const me = await api<{ user: User }>("/v1/auth/me");
      if (me.user.role !== "OWNER") {
        navigate("/user", { replace: true });
        return;
      }
      const [projectBody, inviteBody, jobBody] = await Promise.all([
        api<{ projects: Project[] }>("/v1/projects"),
        api<{ invites: Invite[] }>("/v1/invites"),
        api<{ jobs: AgentJob[] }>("/v1/agent-jobs"),
      ]);
      const projectList = projectBody.projects ?? [];
      const fileGroups = await Promise.all(projectList.map(async (project) => {
        try { return (await api<{ files: VaultFile[] }>(`/v1/files?projectId=${project.id}`)).files ?? []; }
        catch { return [] as VaultFile[]; }
      }));
      setUser(me.user);
      setProjects(projectList);
      setInvites(inviteBody.invites ?? []);
      setJobs(jobBody.jobs ?? []);
      setFiles(fileGroups.flat());
      setSelectedProjectId((current) => current ?? projectList[0]?.id ?? null);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo cargar el panel.";
      if (message === "authentication_required" || message.includes("401")) navigate("/auth", { replace: true });
      else setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  useEffect(() => {
    if (active !== "Chat Privado" || !selectedProjectId) return;
    void api<{ messages: Message[] }>(`/v1/messages?projectId=${selectedProjectId}`)
      .then((body) => setMessages(body.messages ?? []))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "No se pudo cargar el chat."));
  }, [active, selectedProjectId]);

  const filteredProjects = useMemo(() => projects.filter((project) => `${project.name} ${project.description}`.toLowerCase().includes(query.toLowerCase())), [projects, query]);

  async function logout() {
    await fetch("/v1/auth/logout", { method: "POST", credentials: "include" });
    navigate("/auth", { replace: true });
  }

  async function createProject(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/v1/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: projectName, description: projectDescription }) });
      setProjectName(""); setProjectDescription(""); setNotice("Proyecto creado."); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo crear el proyecto."); }
  }

  async function createInvite(event: FormEvent) {
    event.preventDefault();
    if (!selectedProjectId) return;
    setError("");
    try {
      const body = await api<{ invite: Invite }>("/v1/invites", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ projectId: selectedProjectId, label: inviteLabel }) });
      setNotice(`Invitación creada: /invite/${body.invite.token}`); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo crear la invitación."); }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!selectedProjectId || !messageText.trim()) return;
    setError("");
    try {
      await api(`/v1/messages?projectId=${selectedProjectId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: messageText }) });
      setMessageText("");
      const body = await api<{ messages: Message[] }>(`/v1/messages?projectId=${selectedProjectId}`);
      setMessages(body.messages ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo enviar el mensaje."); }
  }

  async function runAgent(event: FormEvent) {
    event.preventDefault();
    if (!agentInput.trim()) return;
    setError(""); setAgentOutput("");
    try {
      const body = await api<{ output?: string; error?: string }>("/v1/agent-jobs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ projectId: selectedProjectId, input: agentInput }) });
      setAgentOutput(body.output ?? "Trabajo completado."); setAgentInput(""); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo ejecutar el agente."); }
  }

  if (loading) return <main className="grid min-h-svh place-items-center bg-[#061321] text-slate-300">Comprobando sesión…</main>;

  return (
    <main className="min-h-svh bg-[#061321] text-white">
      <div className="flex min-h-svh">
        <Sidebar active={active} setActive={setActive} />
        <section className="min-w-0 flex-1">
          <header className="flex h-16 items-center gap-4 border-b border-slate-800 px-5 lg:px-8">
            <div className="lg:hidden"><Logo /></div>
            <div className="relative max-w-md flex-1"><Search className="absolute left-3 top-2.5 size-4 text-slate-500" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en proyectos..." className="h-9 border-slate-800 bg-[#0b1b2b] pl-9 text-xs text-white" /></div>
            <Bell className="size-4 text-slate-400" />
            <button onClick={() => void logout()} className="flex items-center gap-2 text-xs text-slate-300"><span className="grid size-8 place-items-center rounded-full bg-blue-600">O</span><span className="hidden md:block">{user?.name || "Owner"}<br /><small className="text-[9px] text-slate-500">OWNER</small></span><ChevronDown className="size-3" /></button>
          </header>

          <div className="mx-auto max-w-[1500px] p-5 lg:p-8">
            {error && <p role="alert" className="mb-4 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
            {notice && <p className="mb-4 rounded-lg border border-blue-900 bg-blue-950/50 p-3 text-sm text-blue-100">{notice}</p>}

            {active === "Dashboard" && <>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-slate-400">Panel Owner / Administrador</p><h1 className="mt-1 text-3xl font-semibold">Bienvenido, {user?.name || "Owner"}</h1><p className="text-sm text-slate-500">Control de tu espacio privado</p></div><Status>API CONECTADA</Status></div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={<FolderKanban />} label="Proyectos" value={String(projects.length)} note="Datos reales de API" /><Metric icon={<Users />} label="Invitaciones" value={String(invites.length)} note="Registros disponibles" /><Metric icon={<FileText />} label="Archivos" value={String(files.length)} note="Metadatos disponibles" /><Metric icon={<MessageCircle />} label="Chat" value={String(messages.length)} note="Proyecto seleccionado" /><Metric icon={<Upload />} label="Trabajos IA" value={String(jobs.length)} note="Historial del agente" /></div>
              <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]"><Card className="border-slate-800 bg-[#0b1b2b]"><CardContent className="flex min-h-40 items-center gap-6 p-6"><div className="hidden size-24 place-items-center rounded-3xl bg-gradient-to-br from-slate-900 to-blue-900 text-5xl md:grid">◈</div><div className="flex-1"><div className="flex items-center gap-2"><h2 className="text-xl font-semibold">AGENTE TAIKO</h2><span className="rounded bg-violet-600 px-1.5 text-[9px] font-bold">IA</span></div><p className="mt-1 text-sm text-slate-400">Asistente técnico interno</p><p className="mt-3 text-xs text-slate-500">Buscar, analizar y trabajar dentro del entorno autorizado.</p><Button onClick={() => setActive("Agente Taiko")} className="mt-4 bg-blue-600 text-xs">Abrir Agente Taiko</Button></div></CardContent></Card><Card className="border-slate-800 bg-[#0b1b2b]"><CardHeader><CardTitle className="text-sm">Estado del repositorio</CardTitle></CardHeader><CardContent className="space-y-3 text-xs">{["Frontend Vercel", "API Cloudflare Worker", "Proxy /v1 → /api", "Autenticación única"].map((item) => <div key={item} className="flex items-center justify-between border-b border-slate-800 pb-2"><span className="text-slate-300">{item}</span><span className="text-emerald-400">Configurado en código</span></div>)}</CardContent></Card></div>
              <div className="mt-5 grid gap-5 xl:grid-cols-2"><Card className="border-slate-800 bg-[#0b1b2b]"><CardHeader><CardTitle className="text-sm">Proyectos recientes</CardTitle></CardHeader><CardContent className="space-y-2">{filteredProjects.slice(0, 5).map((project) => <div key={project.id} className="rounded-lg border border-slate-800 p-3"><p className="text-sm font-medium">{project.name}</p><p className="text-[11px] text-slate-500">{project.description || "Sin descripción"}</p></div>)}{!filteredProjects.length && <p className="py-8 text-center text-sm text-slate-500">No hay proyectos.</p>}</CardContent></Card><Card className="border-slate-800 bg-[#0b1b2b]"><CardHeader><CardTitle className="text-sm">Acciones rápidas</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2"><Button onClick={() => setActive("Proyectos")} variant="outline" className="justify-start border-slate-700 bg-transparent text-xs"><Plus className="size-3" /> Nuevo proyecto</Button><Button onClick={() => setActive("Invitaciones")} variant="outline" className="justify-start border-slate-700 bg-transparent text-xs"><Send className="size-3" /> Enviar invitación</Button><Button onClick={() => setActive("Archivos")} variant="outline" className="justify-start border-slate-700 bg-transparent text-xs"><Upload className="size-3" /> Ver archivos</Button><Button onClick={() => setActive("Chat Privado")} variant="outline" className="justify-start border-slate-700 bg-transparent text-xs"><MessageCircle className="size-3" /> Nuevo chat</Button></CardContent></Card></div>
            </>}

            {active === "Proyectos" && <Card className="border-slate-800 bg-[#0b1b2b]"><CardHeader><CardTitle>Proyectos</CardTitle></CardHeader><CardContent className="grid gap-6 lg:grid-cols-[360px_1fr]"><form onSubmit={createProject} className="grid gap-3"><Input value={projectName} onChange={(e) => setProjectName(e.target.value)} required placeholder="Nombre del proyecto" className="border-slate-700 bg-slate-950 text-white" /><Input value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder="Descripción" className="border-slate-700 bg-slate-950 text-white" /><Button className="bg-blue-600"><Plus className="size-4" /> Crear proyecto</Button></form><div className="grid gap-2">{filteredProjects.map((project) => <button key={project.id} onClick={() => setSelectedProjectId(project.id)} className={`rounded-xl border p-4 text-left ${selectedProjectId === project.id ? "border-blue-500 bg-blue-950/30" : "border-slate-800"}`}><strong>{project.name}</strong><p className="mt-1 text-sm text-slate-400">{project.description || "Sin descripción"}</p></button>)}</div></CardContent></Card>}

            {active === "Invitaciones" && <Card className="border-slate-800 bg-[#0b1b2b]"><CardHeader><CardTitle>Invitaciones</CardTitle></CardHeader><CardContent className="grid gap-6 lg:grid-cols-[360px_1fr]"><form onSubmit={createInvite} className="grid gap-3"><select value={selectedProjectId ?? ""} onChange={(e) => setSelectedProjectId(Number(e.target.value))} className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm"><option value="">Selecciona proyecto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><Input value={inviteLabel} onChange={(e) => setInviteLabel(e.target.value)} placeholder="Nombre / etiqueta" className="border-slate-700 bg-slate-950 text-white" /><Button disabled={!selectedProjectId} className="bg-blue-600"><Send className="size-4" /> Crear invitación</Button></form><div className="grid gap-2">{invites.map((invite) => <div key={invite.id} className="rounded-xl border border-slate-800 p-4"><strong>{invite.label}</strong><p className="mt-1 break-all text-xs text-slate-400">/invite/{invite.token}</p><p className="mt-1 text-[11px] text-slate-500">{invite.active ? "Activa" : "Consumida / revocada"}</p></div>)}</div></CardContent></Card>}

            {active === "Chat Privado" && <Card className="border-slate-800 bg-[#0b1b2b]"><CardHeader><CardTitle>Chat privado</CardTitle></CardHeader><CardContent className="grid gap-4"><select value={selectedProjectId ?? ""} onChange={(e) => setSelectedProjectId(Number(e.target.value))} className="max-w-sm rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm"><option value="">Selecciona proyecto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><div className="max-h-96 space-y-2 overflow-auto rounded-xl border border-slate-800 p-4">{messages.map((message) => <div key={message.id} className={`rounded-lg p-3 text-sm ${message.author === "admin" ? "ml-auto max-w-[80%] bg-blue-600/20" : "mr-auto max-w-[80%] bg-slate-800"}`}>{message.body}</div>)}{!messages.length && <p className="text-sm text-slate-500">Sin mensajes.</p>}</div><form onSubmit={sendMessage} className="flex gap-2"><Input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Escribe un mensaje" className="border-slate-700 bg-slate-950 text-white" /><Button disabled={!selectedProjectId || !messageText.trim()} className="bg-blue-600"><Send className="size-4" /></Button></form></CardContent></Card>}

            {active === "Archivos" && <Card className="border-slate-800 bg-[#0b1b2b]"><CardHeader><CardTitle>Archivos</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{files.map((file) => <div key={file.id} className="rounded-xl border border-slate-800 p-3"><div className="grid h-20 place-items-center rounded-lg bg-slate-900 text-blue-300"><FileText /></div><p className="mt-2 truncate text-sm">{file.name}</p><p className="text-[11px] text-slate-500">{file.mime || "archivo"}</p></div>)}{!files.length && <p className="col-span-full py-8 text-center text-sm text-slate-500">No hay archivos registrados.</p>}</CardContent></Card>}

            {active === "Agente Taiko" && <Card className="border-slate-800 bg-[#0b1b2b]"><CardHeader><CardTitle>Agente Taiko</CardTitle></CardHeader><CardContent className="grid gap-4"><select value={selectedProjectId ?? ""} onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)} className="max-w-sm rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm"><option value="">Sin proyecto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><form onSubmit={runAgent} className="grid gap-3"><textarea value={agentInput} onChange={(e) => setAgentInput(e.target.value)} rows={5} placeholder="Escribe la tarea para TAIKO" className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" /><Button disabled={!agentInput.trim()} className="w-fit bg-blue-600"><Cloud className="size-4" /> Ejecutar</Button></form>{agentOutput && <pre className="whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200">{agentOutput}</pre>}</CardContent></Card>}

            {!["Dashboard", "Proyectos", "Invitaciones", "Chat Privado", "Archivos", "Agente Taiko"].includes(active) && <Card className="border-slate-800 bg-[#0b1b2b]"><CardHeader><CardTitle>{active}</CardTitle></CardHeader><CardContent><div className="grid place-items-center py-14 text-center text-slate-500"><Archive className="mb-3 size-7" /><p>Sección disponible en el panel. No se ha simulado ninguna operación externa en esta reparación del repositorio.</p></div></CardContent></Card>}
          </div>
        </section>
      </div>
    </main>
  );
}
