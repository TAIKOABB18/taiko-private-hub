import app from "./app";
import { ItemStore, type User } from "./item-store";
export { ItemStore } from "./item-store";

type Env = {
  ITEMS: DurableObjectNamespace<ItemStore>;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_ENDPOINT_URL_S3?: string;
  AWS_REGION?: string;
  [key: string]: unknown;
};

const BUCKET = "taiko-private-hub-files";
const COOKIE = "taiko_session";
const encoder = new TextEncoder();

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

function cookieValue(request: Request, name: string) {
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}

async function sha256Bytes(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

async function sha256Hex(value: string | Uint8Array) {
  return Array.from(await sha256Bytes(value), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(key: Uint8Array, value: string) {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value)));
}

function encodePath(path: string) {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

async function signedS3Fetch(env: Env, method: string, key: string, body?: Uint8Array, contentType?: string, query = "") {
  const accessKey = String(env.AWS_ACCESS_KEY_ID || "").trim();
  const secret = String(env.AWS_SECRET_ACCESS_KEY || "").trim();
  const endpoint = String(env.AWS_ENDPOINT_URL_S3 || "").trim().replace(/\/+$/, "");
  const region = String(env.AWS_REGION || "").trim();
  if (!accessKey || !secret || !endpoint || !region) throw new Error("neon_storage_not_configured");

  const base = new URL(endpoint);
  const pathname = `/${BUCKET}${key ? `/${encodePath(key)}` : ""}`;
  const target = new URL(`${pathname}${query ? `?${query}` : ""}`, base.origin);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const payloadHash = await sha256Hex(body || new Uint8Array());
  const headers: Record<string, string> = { host: target.host, "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate };
  if (contentType) headers["content-type"] = contentType;
  const signedNames = Object.keys(headers).sort();
  const canonicalHeaders = signedNames.map((name) => `${name}:${headers[name].trim()}\n`).join("");
  const canonicalQuery = [...target.searchParams.entries()].sort(([a, av], [b, bv]) => a === b ? av.localeCompare(bv) : a.localeCompare(b)).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  const canonicalRequest = [method, pathname, canonicalQuery, canonicalHeaders, signedNames.join(";"), payloadHash].join("\n");
  const scope = `${date}/${region}/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256Hex(canonicalRequest)}`;
  const kDate = await hmac(encoder.encode(`AWS4${secret}`), date);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, "s3");
  const kSigning = await hmac(kService, "aws4_request");
  const signature = Array.from(await hmac(kSigning, stringToSign), (b) => b.toString(16).padStart(2, "0")).join("");
  const requestHeaders = new Headers(headers);
  requestHeaders.set("authorization", `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedNames.join(";")}, Signature=${signature}`);
  return fetch(target, { method, headers: requestHeaders, body: body && method !== "GET" && method !== "HEAD" ? body : undefined });
}

async function currentUser(request: Request, env: Env) {
  const token = cookieValue(request, COOKIE);
  if (!token) return null;
  const hub = env.ITEMS.get(env.ITEMS.idFromName("hub"));
  return hub.getUserBySession(await sha256Hex(token));
}

async function allowed(request: Request, env: Env, projectId: number): Promise<User | null> {
  const user = await currentUser(request, env);
  if (!user) return null;
  const hub = env.ITEMS.get(env.ITEMS.idFromName("hub"));
  return (await hub.canAccessProject(user, projectId)) ? user : null;
}

function safeName(value: string) {
  const name = value.replace(/[\\/\0]/g, "_").trim();
  return name.slice(0, 180) || "archivo";
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function xmlText(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">") || "";
}

async function storageApi(request: Request, env: Env) {
  const url = new URL(request.url);
  const projectId = Number(url.searchParams.get("projectId") || 0);
  if (!Number.isInteger(projectId) || projectId <= 0) return json({ error: "invalid_project" }, 400);
  const user = await allowed(request, env, projectId);
  if (!user) return json({ error: cookieValue(request, COOKIE) ? "project_access_denied" : "authentication_required" }, cookieValue(request, COOKIE) ? 403 : 401);
  const prefix = `projects/${projectId}/`;

  if (request.method === "POST" && url.pathname === "/api/files/upload") {
    const data = await request.json().catch(() => null) as { name?: string; mime?: string; base64?: string } | null;
    if (!data?.base64 || !data.name) return json({ error: "invalid_upload" }, 400);
    let bytes: Uint8Array;
    try { bytes = decodeBase64(data.base64); } catch { return json({ error: "invalid_base64" }, 400); }
    if (bytes.byteLength > 10 * 1024 * 1024) return json({ error: "file_too_large", maxBytes: 10485760 }, 413);
    const name = safeName(data.name);
    const key = `${prefix}${crypto.randomUUID()}-${name}`;
    const mime = String(data.mime || "application/octet-stream").slice(0, 120);
    const upstream = await signedS3Fetch(env, "PUT", key, bytes, mime);
    if (!upstream.ok) return json({ error: "storage_upload_failed", status: upstream.status }, 502);
    return json({ file: { id: key, projectId, name, storageKey: key, size: bytes.byteLength, mime } }, 201);
  }

  if (request.method === "GET" && url.pathname === "/api/files/download") {
    const key = url.searchParams.get("key") || "";
    if (!key.startsWith(prefix)) return json({ error: "file_access_denied" }, 403);
    const upstream = await signedS3Fetch(env, "GET", key);
    if (!upstream.ok) return json({ error: upstream.status === 404 ? "file_not_found" : "storage_download_failed" }, upstream.status === 404 ? 404 : 502);
    const headers = new Headers();
    headers.set("content-type", upstream.headers.get("content-type") || "application/octet-stream");
    headers.set("content-disposition", `attachment; filename*=UTF-8''${encodeURIComponent(key.split("/").pop()?.replace(/^[0-9a-f-]{36}-/, "") || "archivo")}`);
    headers.set("cache-control", "private, no-store");
    return new Response(upstream.body, { status: 200, headers });
  }

  if (request.method === "GET" && url.pathname === "/api/files") {
    const query = `list-type=2&prefix=${encodeURIComponent(prefix)}`;
    const upstream = await signedS3Fetch(env, "GET", "", undefined, undefined, query);
    if (!upstream.ok) return json({ error: "storage_list_failed", status: upstream.status }, 502);
    const xml = await upstream.text();
    const contents = [...xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/gi)].map((match) => {
      const block = match[1];
      const key = xmlText(block, "Key");
      const name = key.split("/").pop()?.replace(/^[0-9a-f-]{36}-/, "") || key;
      return { id: key, projectId, name, storageKey: key, size: Number(xmlText(block, "Size") || 0), mime: "application/octet-stream", updatedAt: xmlText(block, "LastModified") };
    });
    return json({ files: contents });
  }

  return null;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname === "/api/files" || url.pathname === "/api/files/upload" || url.pathname === "/api/files/download") {
      try {
        const response = await storageApi(request, env);
        if (response) return response;
      } catch (error) {
        const message = error instanceof Error ? error.message : "storage_error";
        return json({ error: message }, message === "neon_storage_not_configured" ? 503 : 500);
      }
    }
    return app.fetch(request, env as never, ctx);
  },
} satisfies ExportedHandler<Env>;
