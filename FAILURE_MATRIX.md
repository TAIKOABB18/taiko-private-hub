# Failure matrix

| Componente | Fallo previsto | Detección | Recuperación | Prueba ejecutada | Resultado |
|---|---|---|---|---|---|
| Frontend build | Dependencias ausentes | `bun run build` | Instalar con lockfile | Sí | PRUEBA FALLIDA: `react-router: command not found` |
| Registry | HTTP 520 | salida de `bun install` | reintentar/backoff o usar cache | Sí | BLOQUEADO EXTERNO |
| Docker | Docker no instalado | `docker --version` | ejecutar en host Docker | Sí | BLOQUEADO EXTERNO |
| PostgreSQL | DB no disponible | `/readyz`/migración | configurar DATABASE_URL | No | BLOQUEADO EXTERNO |
| R2/S3 | bucket/credenciales ausentes | init multipart | configurar S3_* | No | BLOQUEADO EXTERNO |
| Multipart | parte faltante/ETag inválido | complete | consultar estado y reintentar parte | No | IMPLEMENTADO + NO PROBADO |
| Sesión | cookie ausente/revocada | middleware auth | login de nuevo | No | IMPLEMENTADO + NO PROBADO |
| IDOR | usuario sin membresía | consulta de membresía | devolver 403 | No | IMPLEMENTADO + NO PROBADO |
| Agente | repo no allowlisted | política | bloquear job | Sí en política local | IMPLEMENTADO + NO PROBADO en servidor |
| Producción | sin aprobación Owner | gate de política | bloquear publicación | Sí en helper local | IMPLEMENTADO + NO PROBADO |
