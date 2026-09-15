# Seguridad

## Implementado en código

- RBAC único: `OWNER`, `ADMIN`, `MEMBER`, `UPLOADER`, `VIEWER`.
- `editor` se migra a `MEMBER`; no es rol válido en el modelo nuevo.
- Cookies de sesión HttpOnly, Secure y SameSite=Lax.
- Tokens opacos guardados como SHA-256.
- Usuarios bloqueados no pueden iniciar sesión ni aceptar invitaciones.
- Registro público cerrado; la creación de cuenta exige invitación.
- Password reset con token aleatorio, hash en PostgreSQL, expiración, un solo uso e invalidación de sesiones.
- Consultas de membresía server-side para proyectos, chat, uploads y descargas.
- URLs presignadas; Fastify no transporta bytes grandes.
- Headers de seguridad: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- CORS restrictivo mediante `PUBLIC_ORIGIN` cuando está configurado.
- Rate limiting local por IP y ruta; producción debe usar un limitador distribuido.
- Allowlist deny-by-default para proveedores del Agente Taiko.
- Producción del agente requiere aprobación Owner.
- Runner de código no confiable falla cerrado si no existe sandbox externo.

## Pendiente de verificación externa

- PostgreSQL/R2/S3 reales.
- TLS, dominio y cookies en el despliegue final.
- Rate limiting distribuido multi-instancia.
- CSRF completo si se despliega con cookies cross-site; con SameSite y mismo origen debe mantenerse la política de origen.
- Antivirus/antimalware y clasificación de archivos.
- Sandbox Docker/worker real.
- Rotación operativa de secretos y backups restaurados.
