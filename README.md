# Chedul frontend

React 19 + TypeScript + Vite. Habla con la API de `chedul-core`.

Pantallas: inicio (progreso, próximas fechas, últimos aportes), estado
académico, mapa de correlativas, aportes (subir, buscar, favoritos), calendario
(vista de mes con eventos y vista de semana con el horario de cursada) y mails
de profesores.

## Desarrollo

```sh
pnpm install
cp .env.example .env.local   # VITE_API_URL=http://localhost:8080/api/v1
pnpm dev
```

La app queda en http://localhost:5173. La API tiene que estar corriendo
(ver el README de chedul-core) y permitir ese origen en `CORS_ORIGINS`
(ya viene así por defecto en desarrollo).

```sh
pnpm build   # chequea tipos y genera dist/
pnpm lint
```

## Deploy en Vercel

1. En `vercel.json`, reemplazar `REEMPLAZAR-CON-LA-URL-DE-CLOUD-RUN.run.app`
   por la URL de la API (la muestra `scripts/deploy-cloudrun.sh` de
   chedul-core al terminar) y commitear.
2. En Vercel: **Add New → Project**, importar este repo. Detecta Vite solo.
3. Agregar la variable de entorno `VITE_API_URL=/api/v1` y desplegar.

Vercel hace de proxy: el navegador le pide `/api/...` al mismo dominio del
front y Vercel se lo pasa a Cloud Run. Así la cookie de sesión es del mismo
sitio y funciona también en Safari y iPhone, que bloquean las cookies de
otros dominios. Con el proxy no hace falta configurar `CORS_ORIGINS` en la API.

La segunda regla de `vercel.json` devuelve `index.html` para cualquier otra
ruta, porque las rutas las maneja React Router. En Netlify, `public/_redirects`
hace lo mismo (hay que reemplazar la misma URL).

## Sesión

El login devuelve un access token (dura 15 minutos y se guarda solo en memoria)
y deja una cookie `httpOnly` con el refresh token. Al recargar la página o
cuando el access token vence, el front pide uno nuevo a `/refresh-token`.
