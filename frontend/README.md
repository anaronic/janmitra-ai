# JanMitra AI Frontend

React + Vite client for JanMitra AI, a multilingual financial and legal literacy assistant for Indian citizens.

## Local Development

```powershell
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` and talks to the backend at `http://localhost:8000` by default.

To point the frontend at a different backend, create `frontend/.env.local`:

```text
VITE_API_BASE_URL=https://your-backend.example.com
```

Vite reads environment variables at build time, so redeploy or rebuild after changing `VITE_API_BASE_URL`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Vite dev server. |
| `npm run build` | Create the production build in `dist/`. |
| `npm run lint` | Run ESLint across the frontend source. |
| `npm run preview` | Preview the production build locally. |

## Deployment

Deploy this directory as the Vercel project root and set:

```text
VITE_API_BASE_URL=https://<your-backend-host>
```

After deployment, configure the backend `CORS_ORIGINS` environment variable with the Vercel frontend URL so browser requests are allowed.
