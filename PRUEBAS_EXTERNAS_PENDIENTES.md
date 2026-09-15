# Pruebas externas pendientes

Estas pruebas requieren infraestructura o credenciales que no están disponibles en el proyecto:

- PostgreSQL real: migración, concurrencia, transacciones de invitación, sesiones y password reset.
- R2/S3 real: bucket privado, CORS, URLs presignadas, ETags, HEAD, descarga y aborto.
- Multipart real de 10–15 GB+: pausa, recarga, recuperación sin repetir partes y complete.
- Fastify desplegado: CORS con dominio final, cookies Secure, TLS, rate limiting distribuido.
- Realtime: WebSocket/SSE detrás del despliegue final y recuperación después de desconexión.
- Email: entrega de tokens de password reset.
- TAIKO AI API: `/v1/models`, límites y modelos autorizados.
- GitHub/Vercel/Render técnicos: allowlist y previews reales.
- Hetzner, DNS y certificados.
- Sandbox Docker con límites de CPU/RAM/disco/red.

No se clasifica ninguna de estas pruebas como PASS.
