import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

type User = { id: number; email: string; name: string; role: "OWNER" | "COLLABORATOR" };
type Project = { id: number; name: string; description: string; status: "active" | "archived" };
type VaultFile = { id: number; projectId: number; name: string; mime: string; size: number };

export function meta() {
  return [{ title: "TAIKO PRIVATE HUB · Mi panel" }];
}

export default function UserPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meResponse = await fetch("/v1/auth/me", { credentials: "include" });
        if (meResponse.status === 401) {
          navigate("/auth", { replace: true });
          return;
        }
        const me = (await meResponse.json()) as { user?: User; error?: string };
        if (!meResponse.ok || !me.user) throw new Error(me.error ?? "No se pudo comprobar la sesión.");
        if (me.user.role === "OWNER") {
          navigate("/", { replace: true });
          return;
        }

        const projectsResponse = await fetch("/v1/projects", { credentials: "include" });
        const projectBody = (await projectsResponse.json().catch(() => ({}))) as { projects?: Project[]; error?: string };
        if (!projectsResponse.ok) throw new Error(projectBody.error ?? "No se pudieron cargar los proyectos.");
        const allowedProjects = projectBody.projects ?? [];

        const fileGroups = await Promise.all(
          allowedProjects.map(async (project) => {
            const response = await fetch(`/v1/files?projectId=${encodeURIComponent(String(project.id))}`, { credentials: "include" });
            if (!response.ok) return [] as VaultFile[];
            const body = (await response.json().catch(() => ({}))) as { files?: VaultFile[] };
            return body.files ?? [];
          }),
        );

        if (!cancelled) {
          setUser(me.user);
          setProjects(allowedProjects);
          setFiles(fileGroups.flat());
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Error al cargar el panel.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  async function logout() {
    await fetch("/v1/auth/logout", { method: "POST", credentials: "include" });
    navigate("/auth", { replace: true });
  }

  if (loading) {
    return <main className="grid min-h-svh place-items-center bg-[#061321] text-slate-300">Comprobando sesión…</main>;
  }

  return (
    <main className="min-h-svh bg-[#061321] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-300">TAIKO PRIVATE HUB</p>
            <h1 className="mt-2 text-3xl font-semibold">Panel Usuario / Colaborador</h1>
            <p className="text-sm text-slate-400">{user ? `${user.name} · ${user.email}` : "Acceso privado"}</p>
          </div>
          <button onClick={() => void logout()} className="rounded-lg border border-slate-700 px-4 py-2 text-sm">Cerrar sesión</button>
        </header>

        {error && <p role="alert" className="mb-6 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-[#0b1b2b] p-5">
            <h2 className="font-semibold">Mis proyectos</h2>
            <div className="mt-4 grid gap-3">
              {projects.map((project) => (
                <article key={project.id} className="rounded-xl border border-slate-800 p-4">
                  <strong>{project.name}</strong>
                  <p className="mt-1 text-sm text-slate-400">{project.description || "Sin descripción"}</p>
                </article>
              ))}
              {!projects.length && <p className="text-sm text-slate-500">No tienes proyectos asignados.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0b1b2b] p-5">
            <h2 className="font-semibold">Mis archivos</h2>
            <div className="mt-4 grid gap-2">
              {files.slice(0, 20).map((file) => <div key={file.id} className="rounded-lg border border-slate-800 p-3 text-sm">{file.name}</div>)}
              {!files.length && <p className="text-sm text-slate-500">No hay archivos disponibles.</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
