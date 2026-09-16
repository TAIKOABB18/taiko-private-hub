import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import LogOut from "lucide-react/dist/esm/icons/log-out.js";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban.js";

export function meta() {
  return [{ title: "TAIKO PRIVATE HUB" }, { name: "description", content: "Panel privado de proyectos." }];
}

type User = { id: string; email: string; name: string; role: "OWNER" | "ADMIN" | "MEMBER" | "UPLOADER" | "VIEWER" };
type Project = { id: string; name: string; description: string; role: string };

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meResponse = await fetch("/v1/auth/me", { credentials: "include" });
        if (meResponse.status === 401) { navigate("/auth", { replace: true }); return; }
        if (!meResponse.ok) throw new Error("No se pudo comprobar la sesión.");
        const currentUser = await meResponse.json() as User;
        const projectsResponse = await fetch("/v1/projects", { credentials: "include" });
        if (!projectsResponse.ok) throw new Error("No se pudieron cargar los proyectos.");
        const projectData = await projectsResponse.json() as { items?: Project[] };
        if (!cancelled) { setUser(currentUser); setProjects(projectData.items ?? []); }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Error al cargar el panel.");
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  async function logout() {
    await fetch("/v1/auth/logout", { method: "POST", credentials: "include" });
    navigate("/auth", { replace: true });
  }

  if (loading) return <main className="grid min-h-svh place-items-center bg-[#020b17] text-slate-300">Comprobando sesión…</main>;
  return (
    <main className="min-h-svh bg-[#020b17] px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-center justify-between border-b border-slate-800 pb-6">
          <div><p className="text-sm uppercase tracking-[0.2em] text-violet-300">TAIKO PRIVATE HUB</p><h1 className="mt-2 text-3xl font-bold">Panel {user?.role === "OWNER" || user?.role === "ADMIN" ? "administrador" : "usuario"}</h1><p className="mt-2 text-slate-400">{user?.name || user?.email}</p></div>
          <button onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"><LogOut className="size-4" /> Salir</button>
        </header>
        {error && <p role="alert" className="mb-6 rounded-lg border border-red-900 bg-red-950/50 p-3 text-red-200">{error}</p>}
        <section><div className="mb-4 flex items-center gap-2"><FolderKanban className="size-5 text-violet-300" /><h2 className="text-xl font-semibold">Mis proyectos</h2></div>
          {projects.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-700 p-8 text-slate-400">No hay proyectos autorizados.</p> : <div className="grid gap-4 sm:grid-cols-2">{projects.map((project) => <article key={project.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h3 className="font-semibold">{project.name}</h3><p className="mt-2 text-sm text-slate-400">{project.description || "Sin descripción"}</p><span className="mt-4 inline-block text-xs text-violet-300">Rol: {project.role}</span></article>)}</div>}
        </section>
      </div>
    </main>
  );
}
