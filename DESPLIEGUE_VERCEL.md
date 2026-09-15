# Despliegue en Vercel

Este proyecto está preparado actualmente como Worker de Cloudflare con Durable Objects (`wrangler.jsonc`). Esta pasada **no despliega** ni configura producción.

## Estado

- La app usa React Router en modo framework y persistencia SQLite en Durable Object.
- Las rutas `/api/*` están implementadas en `workers/app.ts`.
- No se usa `x-auth-user`; la autorización real por identidad debe integrarse antes de un despliegue público.
- Los agent jobs solo se encolan con estado `blocked`; no ejecutan código ni producción.

## Migración futura a Vercel

1. Adaptar `workers/app.ts` y el Durable Object a funciones/serverless y una base de datos compatible con Vercel.
2. Configurar autenticación y autorización server-side; no confiar en cabeceras inventadas.
3. Sustituir la persistencia de archivos por un proveedor de object storage con URLs autorizadas.
4. Configurar variables de entorno y secretos en Vercel.
5. Revisar límites de subida, expiración de shares, revocación y auditoría.
6. Ejecutar el build y validaciones del proyecto antes de publicar.

No se afirma compatibilidad Vercel completa hasta realizar esa adaptación.
