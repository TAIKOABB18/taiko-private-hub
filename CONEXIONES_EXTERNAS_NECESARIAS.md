# Conexiones externas necesarias

No incluir secretos en el repositorio. Estos son los datos que deberá proporcionar el propietario cuando quiera configurar pruebas o despliegue.

## PostgreSQL

- `DATABASE_URL`: cadena completa de conexión PostgreSQL.
- Opcional: `PGSSL`/parámetros SSL según el proveedor.
- Ejecutar después `bun run migrate` dentro de `api/`.

## R2/S3

- `S3_ENDPOINT`
- `S3_REGION` (normalmente `auto` en R2)
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- CORS del bucket para `PUT` directo desde el dominio final, incluyendo `ETag` en headers expuestos.

## TAIKO AI API

- `TAIKO_AI_API_URL`
- `TAIKO_AI_API_TOKEN`
- Ruta compatible `GET /v1/models`.
- Límites y modelos autorizados por Owner.

## GitHub técnico exclusivo

- Token de una cuenta técnica nueva, no de la cuenta principal.
- Organización/usuario técnico.
- Repositorios allowlisted.
- Permisos mínimos para leer, crear ramas/commits o abrir PR según necesidad.

## Vercel técnico exclusivo

- Token de cuenta técnica nueva.
- Team ID si aplica.
- Project ID allowlisted.
- Permiso únicamente para Preview hasta aprobación Owner.

## Render técnico exclusivo

- API key de cuenta técnica nueva.
- Workspace/service IDs allowlisted.
- Permiso de Preview separado de producción.

## Hetzner

- API token de cuenta/servidor dedicado.
- ID de proyecto o servidor.
- SSH separado y restringido si se usa.
- Red, firewall, volumen y dominio del servicio.

## DNS

- Proveedor DNS.
- Zona y registros a modificar.
- Dominio final y estrategia TLS.
- No se deben solicitar credenciales DNS en el código.

## Email

- Proveedor SMTP o API de email.
- Host, puerto, usuario y secreto/API key.
- Remitente verificado.
- URL pública de recuperación de contraseña.

Todas las integraciones deben permanecer deny-by-default hasta que el recurso esté allowlisted y sus credenciales hayan sido configuradas fuera del repositorio.
