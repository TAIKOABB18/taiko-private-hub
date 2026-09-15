# TAIKO PRIVATE HUB API

API Fastify + PostgreSQL + S3/R2 privado. No acepta `x-auth-user`: la autenticación es propia mediante sesiones opacas (`HttpOnly`, `Secure`, `SameSite=Lax`) y hash bcrypt. El servicio debe estar detrás de TLS y configurar secretos únicamente mediante entorno.

## Endpoints
- `POST /v1/auth/register`, `POST /v1/auth/login`, `POST /v1/auth/logout`, `GET /v1/auth/me`
- `GET /v1/projects`, `POST /v1/projects` (admin), invitaciones `POST /v1/projects/:projectId/invitations` y aceptación `POST /v1/invitations/:token/accept`
- Chat: `GET/POST /v1/projects/:projectId/messages` (paginación por `limit` y `cursor`)
- Multipart: `POST /v1/projects/:projectId/uploads/init`, URL de parte `POST /v1/uploads/:id/parts/:part`, commit de ETag `POST .../commit`, status `GET`, `complete`, `abort`; verificación `HEAD /v1/files/:fileId/verify` y URL de descarga.

Todas las consultas de proyecto/archivo comprueban membresía en PostgreSQL; los mutadores requieren owner/editor y las operaciones relevantes escriben `audit_events`. R2/S3 solo se prueba con recursos reales configurados: los tests locales deben mockear el cliente y no inventan validaciones remotas.

## Desarrollo
`cp .env.example .env`, configurar `DATABASE_URL` y `S3_*`; `npm install`; `npm run migrate`; `npm run build`. La UI existente conserva su flujo demo en Durable Object y debe migrarse a este API cuando el despliegue de PostgreSQL esté disponible; no se mezclan silenciosamente ambas persistencias.
