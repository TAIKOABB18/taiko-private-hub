# Estado real actual — TAIKO PRIVATE HUB

## IMPLEMENTADO + PROBADO

- Build frontend React Router/Vite validado por `deploy_project(dry_run=true)`.
- Inspección de código y archivos de proyecto.
- Corrección local del loader que pasaba promesas como archivos.
- Escritura de cliente API tipado para auth, proyectos, chat y multipart.
- Escritura del cliente multipart con `slice()`, concurrencia, pausa, reanudación, reintento, cancelación, recuperación de estado y persistencia IndexedDB.
- Modelo RBAC definitivo codificado: `OWNER`, `ADMIN`, `MEMBER`, `UPLOADER`, `VIEWER`.
- Migración explícita de `editor` a `MEMBER` y de roles lowercase a uppercase en `api/src/schema.sql`/`migrate.ts`.
- Manifest y service worker PWA escritos.
- Tests unitarios RBAC escritos, pero no ejecutados por dependencias incompletas.

## IMPLEMENTADO + NO PROBADO

- API Fastify con PostgreSQL/R2, auth, sesiones, proyectos, invitaciones, chat paginado, multipart presignado, commit/complete/abort, verify HEAD y descargas.
- Cliente multipart contra R2/S3 real.
- Migración PostgreSQL y constraints en una base existente.
- PWA en navegador instalado.
- Agente Taiko y política de allowlist existentes en código.

## NO IMPLEMENTADO

- Migración completa de las pantallas actuales del Durable Object al backend Fastify en runtime.
- Endpoints/UI completos de shares, folders, papelera avanzada, ZIP asíncrono, password recovery, SSE/WebSocket y panel Owner completo.
- Runner aislado de código no confiable ejecutable.
- Adaptadores operativos autenticados para GitHub, Vercel y Render.

## PRUEBA FALLIDA

- Instalación Bun: registro npm devolvió HTTP 520.
- Frontend/backend build y tests: no ejecutables con instalación incompleta.

## BLOQUEADO EXTERNO

- PostgreSQL y R2/S3 reales.
- Docker en sandbox.
- Credenciales/cuentas técnicas de GitHub, Vercel, Render, DNS y despliegues.
- Prueba real de archivos de 10–15 GB.
