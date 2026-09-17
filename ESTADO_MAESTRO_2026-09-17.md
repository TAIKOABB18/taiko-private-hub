# TAIKO PRIVATE HUB — ESTADO MAESTRO CONGELADO

Fecha: 2026-09-17

## PUNTO DE RESTAURACIÓN

Repositorio único: `TAIKOABB18/taiko-private-hub`

Rama estable de reparación: `repair-repo-only-20260916`

Commit base de la reparación validada: `8ff082a7c478421407ca45af8561d5f4719401df`

PR: `#1 Repair repo-only API routing and panels`

Regla: no reiniciar el proyecto desde cero. No mezclar arquitecturas. No tocar servicios externos para continuar una reparación de repositorio salvo orden expresa del usuario.

## VALIDADO EN REPOSITORIO

- Repositorio único conservado.
- Diseño TAIKO PRIVATE HUB conservado/restaurado.
- Segundo login local/falso eliminado de la reparación.
- Login único orientado a API real.
- Frontend `/v1/*` encaminado mediante proxy hacia los endpoints `/api/*` del Worker existente.
- Panel Owner usa la ruta API en lugar de depender exclusivamente del loader Cloudflare.
- Panel Colaborador usa la misma ruta API.
- Registro mediante invitación corregido para usar el mismo camino API.
- Creación de proyectos restaurada en Worker.
- Chat privado GET/POST restaurado en Worker.
- Logout real conservado.
- Agente Taiko mantiene ejecución real con proveedor configurado y errores reales cuando falta configuración.
- `/healthz` añadido en la reparación.
- `/jokes` no forma parte de las rutas activas.
- Workflow de comprobación del repositorio añadido.
- `bun install --frozen-lockfile` validado en GitHub Actions.
- `bun run typecheck` validado.
- `bun run build` validado.
- Vercel creó Preview del PR y notificó estado Ready.

## CLOUDFLARE BUILDS — 2026-09-17

- Se auditó el fallo de Cloudflare del commit `d1a6c969983a96be7650547acc8ee12b174e2069`.
- Causa confirmada por el registro de Cloudflare: el build token anterior pertenecía a un usuario que había salido de la organización y quedó inválido.
- El usuario creó y seleccionó en Worker > Settings > Builds un nuevo token de compilación: `Workers Builds - 2026-09-17 02:41`.
- Los reintentos del build histórico siguieron fallando porque conservaban la credencial asociada al build original.
- Este commit documental genera un evento push nuevo en la rama de reparación para que Cloudflare cree una compilación nueva usando la configuración actual.
- No se modifica código funcional, arquitectura, `main`, variables de aplicación ni secretos.

## ESTADO DE GIT

`main` NO contiene todavía esta reparación.

La reparación está aislada en `repair-repo-only-20260916` y el PR #1 está abierto contra `main`.

No fusionar a `main` hasta aprobar el estado reparado, porque un push a `main` puede activar despliegues automáticos.

## ARQUITECTURA QUE DEBE RESPETAR ESTA REPARACIÓN

No introducir Fastify/Render en el flujo reparado del frontend.

Flujo del código reparado:

`Frontend -> /v1/* -> api-proxy -> Worker /api/*`

Los servicios externos y su configuración no se modifican desde esta reparación de repositorio.

## FUNCIONALIDAD PRESENTE EN CÓDIGO DEL WORKER

- autenticación Owner/invitado;
- sesiones;
- login/logout/me;
- proyectos;
- miembros/aislamiento básico por proyecto;
- invitaciones;
- archivos/metadatos del almacén existente;
- shares;
- chat por proyecto;
- trabajos del Agente Taiko;
- configuración de proveedor IA;
- política del agente.

## LO QUE FALTA ANTES DE DECLARAR PRODUCTO TERMINADO

1. Revisar manualmente el Preview del PR: portada, login, panel Owner y panel Colaborador.
2. Confirmar que no existe una segunda pantalla de autenticación durante la navegación real.
3. Probar en Preview creación de proyecto y chat contra un backend accesible para Preview; si el backend externo no está disponible en Preview, registrar el bloqueo sin cambiar arquitectura.
4. Probar invitación completa de extremo a extremo.
5. Probar subida, descarga y gestión de un archivo real. El código actual de metadatos no equivale por sí solo a una prueba R2/S3 completa.
6. Probar Agente Taiko desde la interfaz, incluyendo proveedor no configurado y proveedor configurado.
7. Verificar autorización Owner/Colaborador y aislamiento entre proyectos con pruebas HTTP reales.
8. Revisar recuperación de contraseña; no declararla terminada sin flujo completo.
9. Revisar auditoría/actividad; no mostrar datos simulados como operativos.
10. Solo después de aprobar Preview, fusionar PR #1 a `main` y comprobar el despliegue de producción.
11. Ejecutar smoke tests finales en producción después del merge.

## ESTADOS PERMITIDOS

- OPERATIVO: únicamente con prueba real.
- NO CONFIGURADO.
- NO VERIFICADO.
- BLOQUEADO.
- ERROR.

## PROHIBIDO

- crear otro repositorio;
- reconstruir desde cero;
- volver a introducir un segundo login;
- volver a introducir Fastify/Render sin orden expresa;
- cambiar diseño sin orden;
- crear servicios externos por iniciativa propia;
- declarar PostgreSQL, R2, IA, autenticación o producción operativos solo porque el código compile;
- fusionar automáticamente el PR sin aprobación del usuario.

## REANUDACIÓN

Al continuar: abrir primero este documento, comprobar el PR #1 y reanudar desde la primera prueba pendiente. No rehacer la auditoría completa salvo que el repositorio haya cambiado desde este punto.