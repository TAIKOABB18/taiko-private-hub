# Backup y restore

## PostgreSQL

Usa backups gestionados o `pg_dump` cifrado:

```bash
pg_dump --format=custom "$DATABASE_URL" > backup.dump
pg_restore --clean --if-exists --dbname "$DATABASE_URL" backup.dump
```

## R2/S3

Activa versionado, lifecycle y replicación según el proveedor. Los objetos y sus claves se registran en PostgreSQL; un restore debe recuperar ambos lados.

No guardes backups ni credenciales en el repositorio.
