# Despliegue en Vercel — TAIKO PRIVATE HUB

Vercel aloja **solo el frontend React Router / PWA** de TAIKO PRIVATE HUB.
El backend Fastify permanece separado y se despliega en Render.

## Configuración del frontend

- Framework: React Router v7.
- SSR: activado.
- Adaptador: `@vercel/react-router` mediante `vercelPreset()`.
- Build: `npm run build` (Vercel también puede usar Bun al detectar `bun.lock`).
- Node.js: 24.x.

## Conexión con Render

El navegador no llama directamente a Render. Las llamadas a `/v1/*` llegan primero al frontend de Vercel y la ruta `app/routes/api-proxy.ts` las reenvía al backend.

Variable obligatoria en Vercel:

```text
TAIKO_BACKEND_URL=https://<servicio-render>
```

Mientras `TAIKO_BACKEND_URL` no esté configurada, `/v1/*` devuelve `503 backend_not_configured` de forma deliberada.

Este proxy mantiene la autenticación por cookie en el mismo origen del frontend, evita depender de CORS entre navegador y Render y rechaza peticiones con `Origin` distinto al propio frontend.

## Orden de despliegue

1. Importar únicamente `TAIKOABB18/taiko-private-hub` como proyecto nuevo en Vercel.
2. Verificar que el frontend compila y carga.
3. Desplegar `api/` en Render.
4. Configurar PostgreSQL y el almacenamiento R2/S3 privado en Render.
5. Añadir `TAIKO_BACKEND_URL` en Vercel apuntando al servicio Render.
6. Redeploy de Vercel y prueba extremo a extremo: login → proyectos → chat → subida → descarga.

No se deben conectar ni modificar otros proyectos de Vercel, Render o GitHub durante este flujo.
