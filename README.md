# wavesDb-backend

Backend API para datos de oleaje y boyas.

## Stack
- Node.js + TypeScript
- Express
- MongoDB (Mongoose)
- node-cron para scraping programado

## Variables de entorno
- `PORT` (default: `3000`)
- `MONGO_URL` (obligatoria salvo tests)
- `NODE_ENV` (`development` | `production` | `test`)
- `ALLOWED_ORIGINS` (lista CSV para CORS en producción)
- `SCRAPE_API_KEY` (opcional, protege `GET /scrape` vía header `x-api-key`)

## Scripts
- `npm run dev` - desarrollo
- `npm run build` - compilar TS
- `npm run lint` - lint
- `npm run test:run` - tests

## Endpoints principales
- `GET /buoys`
- `GET /buoys/:id`
- `GET /buoys/:id/data?limit=...`
- `GET /surf-forecast/:spot?page=1&limit=50`
- `GET /scrape` (manual trigger, opcionalmente protegido por API key)

## Notas operativas
- El scheduler corre en zona `Europe/Madrid`.
- Se registran métricas básicas de scraping (duración, éxitos/fallos por tarea).
- El parser de surf-forecast incluye timeout + reintentos exponenciales.
