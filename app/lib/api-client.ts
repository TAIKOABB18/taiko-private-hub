export type HubRole = "OWNER" | "ADMIN" | "MEMBER" | "UPLOADER" | "VIEWER";
export type ApiError = { error: string; status: number };

export class HubApiClient {
  constructor(private readonly baseUrl = "/v1") {}
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, { credentials: "include", ...init, headers: { "content-type": "application/json", ...(init.headers ?? {}) } });
    const body = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) throw Object.assign(new Error(body.error ?? "request_failed"), { status: response.status, error: body.error });
    return body as T;
  }
  me() { return this.request<{ id: string; email: string; name: string; role: HubRole }>("/auth/me"); }
  projects() { return this.request<{ items: Array<{ id: string; name: string; description: string; role: HubRole }> }>("/projects"); }
  login(email: string, password: string) { return this.request<{ user: unknown }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); }
  register(email: string, password: string, name: string) { return this.request("/auth/register", { method: "POST", body: JSON.stringify({ email, password, name }) }); }
  logout() { return this.request("/auth/logout", { method: "POST" }); }
  messages(projectId: string, cursor?: string) { return this.request<{ items: unknown[]; nextCursor: string | null }>(`/projects/${encodeURIComponent(projectId)}/messages${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`); }
  sendMessage(projectId: string, body: string) { return this.request(`/projects/${encodeURIComponent(projectId)}/messages`, { method: "POST", body: JSON.stringify({ body }) }); }
  uploadInit(projectId: string, metadata: { filename: string; contentType: string; sizeBytes: number }) { return this.request<{ uploadId: string; fileId: string; partSizeBytes: number }>(`/projects/${encodeURIComponent(projectId)}/uploads/init`, { method: "POST", body: JSON.stringify(metadata) }); }
  uploadState(uploadId: string) { return this.request<{ status: string; parts: Array<{ partNumber: number; etag: string; sizeBytes: number }> }>(`/uploads/${uploadId}`); }
  partUrl(uploadId: string, partNumber: number) { return this.request<{ url: string; method: "PUT" }>(`/uploads/${uploadId}/parts/${partNumber}`, { method: "POST" }); }
  commitPart(uploadId: string, partNumber: number, etag: string, sizeBytes: number) { return this.request(`/uploads/${uploadId}/parts/${partNumber}/commit`, { method: "POST", body: JSON.stringify({ etag, sizeBytes }) }); }
  complete(uploadId: string, parts: Array<{ partNumber: number; etag: string }>) { return this.request(`/uploads/${uploadId}/complete`, { method: "POST", body: JSON.stringify({ parts }) }); }
  abort(uploadId: string) { return this.request(`/uploads/${uploadId}/abort`, { method: "POST" }); }
}
export const apiClient = new HubApiClient();
