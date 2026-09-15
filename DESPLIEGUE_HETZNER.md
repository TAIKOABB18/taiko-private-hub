# Despliegue en Hetzner

1. Crear servidor Linux con Docker.
2. Clonar el repositorio privado.
3. Configurar PostgreSQL gestionado o contenedor persistente.
4. Configurar bucket R2/S3 privado.
5. Crear `.env` solo en el servidor.
6. Ejecutar en `api/`:

```bash
npm install
npm run migrate
npm run build
npm start
```

7. Colocar TLS y reverse proxy delante de Fastify.
8. Ejecutar health checks `/healthz` y `/readyz`.
9. Configurar backups y logs sin secretos.

No se incluyen credenciales ni dominio reales.
