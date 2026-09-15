# Agente Taiko

## Política

- Un único agente visible: Agente Taiko.
- Deny-by-default.
- Repositorios y proveedores allowlisted explícitamente.
- GitHub, Vercel y Render requieren cuentas técnicas exclusivas.
- Producción siempre requiere aprobación Owner.
- No se llaman proveedores IA directamente.
- La configuración prevista usa exclusivamente `TAIKO_AI_API_URL` y `TAIKO_AI_API_TOKEN`.

## Capacidades preparadas

- Buscar en biblioteca autorizada.
- Trabajos de auditoría, reparación, build, tests y preview.
- Persistencia de jobs, logs, builds, artefactos, repositorios y deployments en PostgreSQL.
- Adaptadores tipados para GitHub/Vercel/Render con deny-by-default.
- Runner/sandbox con contrato aislado y límites declarados; si no hay worker/contenedor configurado, falla cerrado.
- Model discovery mediante `GET /v1/models` de la TAIKO AI API.

## Estados

`QUEUED`, `ANALYZING`, `BUILDING`, `TESTING`, `REPAIRING`, `DEPLOYING`, `READY`, `FAILED`, `BLOCKED`.

## No afirmado como probado

No se probaron credenciales, llamadas externas, ejecución de código no confiable, previews ni despliegues reales.
