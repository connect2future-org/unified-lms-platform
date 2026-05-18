# PES LMS Platform Monorepo

Single-repo, single-deployment full-stack architecture using React + Vite frontend and Node.js + Express backend.

## Final Structure

```text
project-root/
├── client/
├── server/
├── shared/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── render.yaml
└── README.md
```

Removed duplicated legacy folders:
- `frontend/`
- `backend/`

## Tech Stack

- Frontend: React, Vite, React Router
- Backend: Node.js, Express, MongoDB (Mongoose)
- Deployment: Render (single Node web service)

## Monorepo Scripts (Root)

- `npm run install-client` installs frontend dependencies
- `npm run install-server` installs backend dependencies
- `npm run dev` runs backend + frontend concurrently with hot reload
- `npm run client` runs only frontend dev server
- `npm run server` runs only backend dev server
- `npm run build` validates backend and builds frontend
- `npm start` starts backend in production mode

## Development Workflow

1. Install root dependencies:
   - `npm install`
2. Install workspace dependencies:
   - `npm run install-server`
   - `npm run install-client`
3. Configure environment:
   - copy `.env.example` to `.env` and set values
4. Start full stack:
   - `npm run dev`
5. Access app:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000/api/*`

Vite proxies `/api` and `/socket.io` to the backend to avoid CORS in development.

## Production Workflow

1. Build:
   - `npm run build`
2. Run server:
   - `npm start`
3. Express serves `client/dist` and handles SPA fallback for non-API routes.

## API Routing Rules

- All backend routes remain under `/api/*`
- Frontend API calls use relative `/api` base URL
- No absolute API URLs are required in production

## Express Static + SPA Fallback

Implemented in `server/src/app.js`:
- Serve static assets from `client/dist`
- Return `client/dist/index.html` for non-API routes
- Keep API 404/error handling for `/api/*`

## Environment Strategy

Use one root `.env` as source of truth for backend runtime and local dev proxy defaults.

Server variables (secrets stay server-side):
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SMTP_*`
- OTP/password-reset configuration variables

Client-safe variable:
- `VITE_PROXY_TARGET` (used only for local Vite proxy)

Do not expose server secrets with `VITE_` prefix.

## Render Deployment

`render.yaml` defines one Node web service:
- Build command: `npm install && npm run install-server && npm run install-client && npm run build`
- Start command: `npm start`

Set environment variables in Render dashboard (or environment groups), matching `.env.example`.

## Migration Notes

This consolidation keeps `client/` + `server/` as the active production stack and removes duplicate legacy folder structure after runtime/build validation.
