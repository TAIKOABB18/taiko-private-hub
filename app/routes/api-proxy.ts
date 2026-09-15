import type { Route } from "./+types/api-proxy";

const jsonError = (error: string, status: number) =>
  Response.json({ error }, { status, headers: { "cache-control": "no-store" } });

function backendBaseUrl() {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  const value = runtime.process?.env?.TAIKO_BACKEND_URL?.trim();
  return value ? value.replace(/\/+$/, "") : "";
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

async function proxy(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return jsonError("origin_not_allowed", 403);

  const baseUrl = backendBaseUrl();
  if (!baseUrl) return jsonError("backend_not_configured", 503);

  const incomingUrl = new URL(request.url);
  const target = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, `${baseUrl}/`);
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
    console.error("TAIKO backend proxy failed", error);
    return jsonError("backend_unavailable", 502);
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  return proxy(request);
}

export async function action({ request }: Route.ActionArgs) {
  return proxy(request);
}
