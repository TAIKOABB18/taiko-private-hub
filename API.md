# API

## Servicio

Fastify en `api/src/server.ts`, normalmente en el puerto `8080`.

## Salud

- `GET /healthz`: proceso accesible.
- `GET /readyz`: comprueba PostgreSQL.

## Auth

- `POST /v1/auth/register`: siempre devuelve `403 invitation_required`; no existe registro público.
- `POST /v1/auth/login`
- `POST /v1/auth/logout`
- `GET /v1/auth/me`
- `POST /v1/auth/password-reset/request`
- `POST /v1/auth/password-reset/complete`
- `POST /v1/invitations/:token/accept`: crea/asocia usuario y sesión.

## Proyectos e invitaciones

- `POST /v1/projects`: Owner/Admin.
- `GET /v1/projects`: proyectos del usuario autenticado.
- `POST /v1/projects/:projectId/invitations`: Owner/Admin del proyecto.

## Chat

- `GET /v1/projects/:projectId/messages?limit=&cursor=`
- `POST /v1/projects/:projectId/messages`

El historial se pagina desde PostgreSQL. Realtime WebSocket/SSE queda como integración pendiente.

## Multipart

- `POST /v1/projects/:projectId/uploads/init`
- `POST /v1/uploads/:id/parts/:part`
- `POST /v1/uploads/:id/parts/:part/commit`
- `GET /v1/uploads/:id`
- `POST /v1/uploads/:id/complete`
- `POST /v1/uploads/:id/abort`
- `HEAD /v1/files/:fileId/verify`
- `GET /v1/files/:fileId/download`

Las partes se suben directamente a R2/S3 usando URL presignada. La API guarda ETags y estados.

## Configuración

Variables obligatorias: `DATABASE_URL`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.

Opcionales: `S3_REGION`, `PUBLIC_ORIGIN`, `RATE_LIMIT_PER_MINUTE`, `UPLOAD_PART_SIZE_BYTES`, `PASSWORD_RESET_DEV_OUTPUT`.
