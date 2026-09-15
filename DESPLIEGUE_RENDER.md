# Despliegue en Render

Crear un Web Service Node para `api/`:

- Build: `npm install && npm run build`
- Start: `npm start`
- Health: `/healthz`
- Variables: `DATABASE_URL`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `UPLOAD_PART_SIZE_BYTES`, `UPLOAD_MAX_SIZE_BYTES`.

Para archivos grandes, el cliente debe usar URLs presignadas y subir directamente a R2/S3. No debe enviar el contenido de 10–15 GB a Render.

La configuración final requiere una base PostgreSQL y un bucket privados reales.
