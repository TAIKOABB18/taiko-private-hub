# Arquitectura objetivo: TAIKO PRIVATE HUB

## Inspección del scaffold

- React Router SSR + Worker Cloudflare en `workers/app.ts`.
- Persistencia actual: Durable Object SQLite `workers/item-store.ts`, con `projects`, `messages` e `invites`.
- UI actual: `app/routes/home.tsx` y `app/routes/invite.tsx`; el formulario de invitación todavía no crea usuarios ni sube archivos.
- `wrangler.jsonc` solo declara `ASSETS` y `ITEMS`; no hay PostgreSQL, bucket privado, autenticación real ni API multipart.

## Decisión de arquitectura

Para Docker/Hetzner/Render, el backend de producción debe ser un servicio Node/Fastify separado del frontend. PostgreSQL es la fuente de verdad relacional; R2/S3 privado contiene bytes; el navegador carga directamente mediante URLs presignadas multipart. Así el API no mantiene conexiones abiertas ni proxifica archivos grandes.

```text
Frontend / reverse proxy TLS + OIDC
              |
              v
      Private API (Fastify)
        |              |
        v              v
 PostgreSQL       R2/S3 private bucket
 metadata         multipart objects
```

El API mínimo implementado está en `api/`: `Dockerfile`, `package.json`, `tsconfig.json`, `src/schema.sql`, `src/server.ts`, `.env.example` y `README.md`.

## API mínima implementada

- `POST /v1/uploads`: inicia multipart y registra metadata.
- `POST /v1/uploads/:id/parts/:part`: entrega URL presignada para PUT directo.
- `GET /v1/uploads/:id`: consulta estado y partes registradas.
- `POST /v1/uploads/:id/complete`: valida lista, completa multipart y marca el objeto.
- `POST /v1/uploads/:id/abort`: aborta y marca el upload.
- `GET /v1/files/:id/download`: devuelve URL privada temporal.
- `GET /healthz` y `/readyz`.

## Orden recomendado de trabajo

1. Integrar OIDC/JWT real en el reverse proxy o en Fastify; convertir el principal autenticado en `owner_id` y comprobar pertenencia a `project_id` en cada consulta.
2. Añadir tabla de usuarios, membresías/roles, proyectos y auditoría en PostgreSQL; migrar gradualmente la UI fuera de `ITEMS`.
3. Añadir confirmación por parte (`ETag` tras cada PUT) y reconciliación con `ListParts`, para reanudar sin depender solo del estado local del navegador.
4. Añadir límites por usuario/proyecto, rate limiting, idempotency keys, validación de MIME/extensión, antivirus y limpieza programada de multipart incompletos.
5. Configurar bucket privado, CORS mínimo para el frontend, lifecycle de abortados, TLS, backups/PITR de PostgreSQL, logs sin secretos y métricas.
6. Crear cliente de subida con chunking, reintentos exponenciales, pausa/reanudación, checksum SHA-256, persistencia local de `uploadId`/ETags y UI de progreso.
7. Añadir tests unitarios, integración contra PostgreSQL/R2 compatible y pruebas de interrupción/reanudación.
8. Solo después, eliminar `ItemStore` y conectar `home.tsx`/`invite.tsx` al API; no mezclar dos fuentes de verdad en producción.

## Pendientes explícitos

No se han inventado credenciales, endpoints reales ni dominios. No se ha desplegado. El `x-auth-user` del backend es un contrato provisional para el proxy y no es autenticación suficiente por sí mismo. La migración completa de UI, identidad, membresías y cliente multipart queda pendiente.
