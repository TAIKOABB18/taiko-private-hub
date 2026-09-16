import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

mkdirSync("build/server", { recursive: true });

const rawConfig = readFileSync("wrangler.jsonc", "utf8");
const config = JSON.parse(rawConfig.replace(/\/\/[^\n]*/g, "").replace(/,(\s*[}\]])/g, "$1"));

function findServerBuild(dir) {
  if (!existsSync(dir)) return null;
  const direct = join(dir, "index.js");
  if (existsSync(direct)) return direct;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const found = findServerBuild(join(dir, entry.name));
    if (found) return found;
  }
  return null;
}

const serverBuildPath = findServerBuild("build/server");
if (!serverBuildPath) throw new Error("React Router server build index.js not found under build/server");
const serverBuildImport = "./" + serverBuildPath.replaceAll("\\", "/");
console.log(`Using React Router server build: ${serverBuildImport}`);

const sharedEsbuildArgs = [
  "--bundle",
  "--format=esm",
  "--platform=browser",
  "--conditions=workerd,worker,browser",
  "--external:cloudflare:*",
  "--external:node:*",
  "--external:util",
  "--external:crypto",
  "--external:async_hooks",
  "--external:stream",
  "--external:buffer",
  "--external:events",
  "--outfile=build/server/worker.js",
];

if (config.main) {
  execFileSync("node_modules/.bin/esbuild", [
    config.main,
    `--alias:virtual:react-router/server-build=${serverBuildImport}`,
    '--define:import.meta.env.MODE="production"',
    ...sharedEsbuildArgs,
  ], { stdio: "inherit" });
} else {
  const workerEntryPath = "build/server/_cf_worker_entry.js";
  const relativeBuild = "./" + serverBuildPath.replace(/^build\/server\//, "").replaceAll("\\", "/");
  const workerEntry = [
    'import { createRequestHandler } from "react-router";',
    `import * as build from ${JSON.stringify(relativeBuild)};`,
    '',
    'const handler = createRequestHandler(build, "production");',
    '',
    'function shouldServeAsset(request) {',
    '  const method = request.method.toUpperCase();',
    '  if (method !== "GET" && method !== "HEAD") return false;',
    '  const pathname = new URL(request.url).pathname;',
    '  return pathname.startsWith("/assets/") || pathname.includes(".") || pathname === "/robots.txt";',
    '}',
    '',
    'export default {',
    '  async fetch(request, env, ctx) {',
    '    if (env.ASSETS && shouldServeAsset(request)) {',
    '      const assetResponse = await env.ASSETS.fetch(request);',
    '      if (assetResponse.status !== 404) return assetResponse;',
    '    }',
    '    return handler(request, { cloudflare: { env, ctx } });',
    '  },',
    '};',
  ].join("\n");
  writeFileSync(workerEntryPath, workerEntry + "\n");
  execFileSync("node_modules/.bin/esbuild", [workerEntryPath, ...sharedEsbuildArgs], { stdio: "inherit" });
  rmSync(workerEntryPath, { force: true });
}

const manifest = {
  main: "worker.js",
  no_bundle: true,
  rules: [{ type: "ESModule", globs: ["**/*.js", "**/*.mjs"] }],
  compatibility_date: config.compatibility_date,
  compatibility_flags: config.compatibility_flags ?? [],
  assets: { directory: "../client", binding: "ASSETS" },
  ...(config.vars ? { vars: config.vars } : {}),
  ...(config.durable_objects ? { durable_objects: config.durable_objects } : {}),
  ...(config.migrations ? { migrations: config.migrations } : {}),
  ...(config.kv_namespaces ? { kv_namespaces: config.kv_namespaces } : {}),
  ...(config.r2_buckets ? { r2_buckets: config.r2_buckets } : {}),
  ...(config.ai ? { ai: config.ai } : {}),
  ...(config.services ? { services: config.services } : {}),
  ...(config.bindings ? { bindings: config.bindings } : {}),
};
writeFileSync("build/server/wrangler.json", JSON.stringify(manifest, null, 2) + "\n");
console.log("build/server/wrangler.json written.");
