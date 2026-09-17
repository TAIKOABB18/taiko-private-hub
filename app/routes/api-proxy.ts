import type { Route } from "./+types/api-proxy";

const jsonError = (error: string, status: number) =>
  Response.json({ error }, { status, headers: { "cache-control": "no-store" } });

type Runtime = {
  process?: { env?: Record<string, string | undefined> };
  TAIKO_BACKEND_URL?: string;
};

/**
 * Public frontend: Vercel
 * API backend: Cloudflare Worker
 *
 * TAIKO_BACKEND_URL must point to the Worker origin only, without /v1 or /api.
 * Browser calls stay same-origin on /v1/* and this route proxies them to the
 * Worker's existing /api/* endpoints.
 */
function backendBaseUrl(context: Route.LoaderArgs["context"]) {
  const runtime = globalThis as typeof globalThis & Runtime;
  const configured = runtime.process?.env?.TAIKO_BACKEND_URL ?? runtime.TAIKO_BACKEND_URL;
  const cloudflareEnv = (context as { cloudflare?: { env?: Record<string, unknown> } }).cloudflare?.env;
  const value = configured ?? cloudflareEnv?.TAIKO_BACKEND_URL;
  return typeof value === "string" && value.trim() ? value.trim().replace(/\/+$/, "") : "";
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function workerPath(pathname: string) {
  if (pathname === "/v1") return "/api";
  if (pathname.startsWith("/v1/")) return `/api/${pathname.slice(4)}`;
  return pathname;
}

async function proxy(request: Request, context: Route.LoaderArgs["context"]): Promise<Response> {
  if (!isSameOrigin(request)) return jsonError("origin_not_allowed", 403);

  const baseUrl = backendBaseUrl(context);
  if (!baseUrl) return jsonError("api_worker_not_configured", 503);

  const incomingUrl = new URL(request.url);
  const target = new URL(`${workerPath(incomingUrl.pathname)}${incomingUrl.search}`, `${baseUrl}/`);

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.delete("origin");
  headers.set("x-forwarded-host", incomingUrl.host);
  headers.set("x-forwarded-proto", incomingUrl.protocol.replace(":", ""));

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(target, init);
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.set("cache-control", "no-store");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("TAIKO Cloudflare API proxy failed", error);
    return jsonError("api_worker_unavailable", 502);
  }
}

export async function loader({ request, context }: Route.LoaderArgs) {
  return proxy(request, context);
}

export async function action({ request, context }: Route.ActionArgs) {
  return proxy(request, context);
}
