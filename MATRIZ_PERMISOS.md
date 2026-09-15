# Matriz de permisos

| Acción | OWNER | ADMIN | MEMBER | UPLOADER | VIEWER |
|---|---:|---:|---:|---:|---:|
| Leer proyecto autorizado | Sí | Sí | Sí | Sí | Sí |
| Crear proyecto | Sí | Sí | No | No | No |
| Gestionar miembros/invitaciones | Sí | Sí | No | No | No |
| Escribir chat | Sí | Sí | Sí | No | No |
| Subir archivos | Sí | Sí | Sí | Sí | No |
| Descargar archivos autorizados | Sí | Sí | Sí | Sí | Sí |
| Ejecutar auditoría Agente | Según política | Según política | No | No | No |
| Reparar/build/test | Según política | Según política | No | No | No |
| Preview técnica | Según allowlist | Según allowlist | No | No | No |
| Producción | Aprobación explícita | No | No | No | No |
| Configuración global | Sí | Según política | No | No | No |
| Eliminar último Owner | Prohibido | No | No | No | No |

La autorización se comprueba server-side. La visibilidad de botones nunca sustituye a la autorización.
