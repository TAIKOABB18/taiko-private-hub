# TAIKO PRIVATE HUB

Repositorio de un hub privado con frontend React Router y una API Fastify separada para PostgreSQL + R2/S3.

## Arquitectura

- `app/`: frontend y clientes API.
- `api/`: API de producción preparada para Fastify, PostgreSQL y S3-compatible.
- `workers/`: prototipo Durable Object heredado; no es la fuente de verdad de producción.
- `public/manifest.webmanifest`, `public/sw.js`: shell PWA; no promete background upload permanente en iOS.

## Roles definitivos

`OWNER`, `ADMIN`, `MEMBER`, `UPLOADER`, `VIEWER`.

La migración de datos convierte `editor` a `MEMBER` y las variantes lowercase a mayúsculas. No se mantiene un segundo modelo RBAC.

## Comandos reproducibles

```bash
bun install
bun run typecheck
bun run build
cd api && bun install && bun run build
cd api && DATABASE_URL=... bun run migrate
cd api && DATABASE_URL=... S3_ENDPOINT=... S3_BUCKET=... S3_ACCESS_KEY_ID=... S3_SECRET_ACCESS_KEY=... bun run start
```

Los comandos no fueron declarados probados cuando el registro de paquetes devolvió HTTP 520 o faltaron servicios externos.

## Subidas

`app/lib/multipart-upload.ts` divide el `File` mediante `slice()`, no carga el archivo completo en RAM, guarda estado en IndexedDB, conserva el multipart al pausar, aborta al cancelar y recupera partes mediante estado PostgreSQL/S3-compatible.

## Seguridad de agente

TAIKO AI solo se conecta mediante `TAIKO_AI_API_URL` y `TAIKO_AI_API_TOKEN`. GitHub, Vercel y Render son proveedores explícitos de allowlist; producción requiere aprobación Owner. El runner de código no confiable requiere un worker/contenedor aislado y permanece pendiente de prueba donde Docker no está disponible.
