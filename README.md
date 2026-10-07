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

## Deploy en Vercel o Netlify

1. Importar el repo y elegir el framework **Vite** (build `pnpm build`, salida `dist`).
2. Definir la variable `VITE_API_URL` con la URL pública de la API, por
   ejemplo `https://chedul-core.fly.dev/api/v1`.
3. En la API, agregar el dominio del front a `CORS_ORIGINS`.

Las rutas las maneja React Router, así que el hosting tiene que devolver
`index.html` para cualquier ruta. Ya están incluidos `vercel.json` y
`public/_redirects` (Netlify) con esa regla.

## Sesión

El login devuelve un access token (dura 15 minutos y se guarda solo en memoria)
y deja una cookie `httpOnly` con el refresh token. Al recargar la página o
cuando el access token vence, el front pide uno nuevo a `/refresh-token`.
