# Política de Seguridad — WorldModels Jobs

## ⚠️ Incidente de seguridad — Abril 2026

Se detectó y corrigió la exposición accidental de claves privadas de Google Cloud (Vertex AI) en el historial del repositorio.

### Acciones tomadas
- ✅ Archivos eliminados del código activo (`formatted-vertex-key.txt`, `legacy-vertex-key.txt`)
- ✅ `.gitignore` ampliado para prevenir futuros incidentes
- ✅ `.env.example` creado como plantilla segura

### Acción requerida (propietario del repo)
> **CRÍTICO**: Las claves que estuvieron expuestas deben rotarse en Google Cloud Console aunque ya no estén en el código, porque siguen en el historial de Git.

1. Ir a [Google Cloud Console → IAM → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Localizar el service account afectado
3. **Eliminar las claves comprometidas** (pestaña "Keys")
4. Crear nuevas claves si son necesarias
5. Guardar el nuevo JSON en local **nunca en el repo**
6. Actualizar `GOOGLE_APPLICATION_CREDENTIALS` en el `.env`

### Limpiar el historial de Git (opcional pero recomendado)

Para eliminar las claves incluso del historial:

```bash
# Con BFG Repo Cleaner (más simple)
bfg --delete-files formatted-vertex-key.txt
bfg --delete-files legacy-vertex-key.txt
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

> ⚠️ Esto reescribe el historial. Coordinar con todos los colaboradores antes de hacer force push.

## Reglas de seguridad del proyecto

- **Nunca** subir archivos `.env`, claves `.pem`/`.key`, o JSONs de service account al repo
- Usar siempre variables de entorno (ver `.env.example`)
- Las sesiones de WhatsApp (`sessions/`) están en `.gitignore` — mantenerlo así
- Los dumps de base de datos (`local_db_dump*`) están en `.gitignore`
- Rotar credenciales cada 90 días como mínimo

## Reportar vulnerabilidades

Si detectas un problema de seguridad, contactar directamente al propietario del repositorio.
