# Arquitectura final

Frontend existente → Fastify API privada → PostgreSQL para metadatos → R2/S3 privado para bytes.

El navegador debe subir partes directamente a R2/S3 con URLs presignadas. Fastify autentica, autoriza, registra ETags y completa el multipart; no transporta los archivos grandes.

La UI demo Durable Object se conserva en el proyecto, pero no debe usarse como fuente de verdad de producción. La API PostgreSQL es la ruta objetivo.
