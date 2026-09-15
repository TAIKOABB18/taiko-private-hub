# Pruebas ejecutadas

## Ejecutadas con resultado observado

- Inspección de proyecto y archivos fuente: completada.
- Inspección previa del ZIP subido: completada en la fase anterior; no se ejecutó ningún archivo del ZIP.
- Corrección del loader frontend para resolver todas las listas de archivos con `Promise.all`.
- Escritura de pruebas unitarias RBAC en `api/src/rbac.test.ts`.
- Comprobación estática de que no quedan usos activos de `editor` en la autorización del servidor: migración documentada a `MEMBER`.
- La validación frontend posterior terminó correctamente: `deploy_project(dry_run=true)` reportó `build validated`.
- Se reintentó la instalación con Bun y volvió a fallar por HTTP 520 del registro; la validación posterior pudo reutilizar/instalar dependencias del proyecto frontend.

## No ejecutadas

- `bun run build`: no ejecutable con dependencias incompletas.
- `cd api && bun run build`: no ejecutable con dependencias incompletas.
- `cd api && bun test`: no ejecutable con dependencias incompletas.
- PostgreSQL, R2/S3, multipart real y Docker: sin servicios/credenciales disponibles.

Ninguna prueba bloqueada se marca como `PROBADA`.
