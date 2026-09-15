# UI_BUTTON_AUDIT

Estados honestos: `OPERATIVO` solo se usaría con comprobación real. La interfaz usa `NO VERIFICADO`, `NO CONFIGURADO`, `BLOQUEADO` y `ERROR` cuando no hay evidencia.

| Panel | Control | Ruta | Función | Endpoint/servicio | Permiso | Loading | Success | Error | Auditoría | Prueba | Resultado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Portada | Acceder / Entrar | `/` | Abre panel visual | Pendiente conexión Fastify | Público para mostrar; auth server-side pendiente | No | No | No | No | No ejecutada | NO FUNCIONAL EN PRODUCCIÓN |
| Portada | Mostrar contraseña | `/` | Alterna visibilidad local | Browser state | Cualquiera | No | Sí local | No | No | No ejecutada | IMPLEMENTADO + NO PROBADO |
| Portada | Entrar con invitación | `/invite/:token` | Abre registro de invitación | Loader DO demo; API Fastify pendiente | Invitación válida | No | No | Loader 404 | No | No ejecutada | PARCIAL |
| Invitación | Crear cuenta y entrar | `/invite/:token` | Formulario visual | Fastify accept pendiente en esta ruta | Token válido | No | No | Action devuelve bloqueo | No | No ejecutada | BLOQUEADO |
| Owner | Crear proyecto | `/` | Crea proyecto en demo DO | `home` action → `ItemStore` | Owner debería ser server-side | No | Sí en demo | No | No | No ejecutada | DEMO NO PRODUCCIÓN |
| Owner | Crear invitación | `/` | Genera token en demo | `home` action → `ItemStore` | Owner/Admin | No | Sí en demo | No | No | No ejecutada | DEMO NO PRODUCCIÓN |
| Owner | Revocar / Archivar | `/` | Mutación demo | `ItemStore` | Owner/Admin pendiente | No | Sí en demo | No | No | No ejecutada | DEMO NO PRODUCCIÓN |
| Owner | Navegación lateral | `/` | Cambia sección visual | React state | UI | No | Sí local | No | No | No ejecutada | IMPLEMENTADO + NO PROBADO |
| Owner | Buscar | `/` | Filtra proyectos cargados | Estado local | Usuario autenticado debería estar limitado | No | Sí local | No | No | No ejecutada | IMPLEMENTADO + NO PROBADO |
| Owner | Acciones rápidas | `/` | Cambia sección visual | React state | Según RBAC real pendiente | No | Sí local | No | No | No ejecutada | PARCIAL |
| Owner | Logout | `/` | Sale del panel visual | Fastify logout pendiente | Sesión válida | No | Solo local | No | No | No ejecutada | NO FUNCIONAL EN PRODUCCIÓN |
| Owner | Agente Taiko | `/` | Abre módulo visual | API Agent pendiente | Owner/Admin según acción | No | No verificado | Error pendiente | Pendiente | No ejecutada | NO VERIFICADO |
| Usuario | Menú colaborador | No registrado aún | Requiere loader de rol Fastify | `/v1/auth/me` | MEMBER/UPLOADER/VIEWER | — | — | — | — | No ejecutada | NO IMPLEMENTADO |
| Multipart | Pause/Resume/Retry/Cancel | Cliente `app/lib/multipart-upload.ts` | Controla partes IndexedDB | `/v1/uploads/*` + S3 signed URLs | Proyecto autorizado | Sí por parte | Complete pendiente real | Retry local | Audit pendiente | No ejecutada | IMPLEMENTADO + NO PROBADO |

No se marca ningún botón como funcional en producción sin API Fastify conectada y prueba ejecutada.
