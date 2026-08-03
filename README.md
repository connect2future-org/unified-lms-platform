# LMS Platform Monorepo

Single-repo, single-deployment full-stack architecture using React + Vite frontend and Node.js + Express backend.

## Deployment Outcome

- One repository
- One deployment
- One domain
- One production port
- One Node.js runtime process serving both frontend and backend

## Final Structure

```text
project-root/
├── client/                # frontend (equivalent to requested frontend/)
├── server/                # backend (equivalent to requested backend/)
├── shared/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── render.yaml
└── README.md
```

Note: Your repository currently uses `client/` + `server/` names. This keeps Git history and existing imports stable while matching the same architecture as `frontend/` + `backend/`.

## Tech Stack

- Frontend: React, Vite, React Router
- Backend: Node.js, Express, MongoDB (Mongoose)
- Deployment: Render (single Node web service)

## Monorepo Scripts (Root)

- `npm run frontend` alias for frontend dev server
- `npm run backend` alias for backend dev server
- `npm run dev` runs backend + frontend concurrently with hot reload
- `npm run client` runs only frontend dev server
- `npm run server` runs only backend dev server
- `npm run build:server` validates backend server files
- `npm run build:client` builds Vite frontend
- `npm run build` validates backend and builds frontend
- `npm run render-build` installs and builds the full stack for Render
- `npm start` starts backend in production mode

Single install command:
- `npm install` at root (workspace install)

## Development Workflow

1. Install dependencies once at root:
   - `npm install`
2. Configure environment:
   - copy `.env.example` to `.env` and set values
3. Start full stack:
   - `npm run dev`
4. Access app:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000/api/*`

Vite proxies `/api` and `/socket.io` to the backend to avoid CORS in development.
In production, Express serves frontend and API from the same origin, so CORS is not used.

## Production Workflow

1. Build:
   - `npm run build`
2. Run server:
   - `npm start`
3. Express serves `client/dist` and handles SPA fallback for non-API routes.

Production behavior from one app:
- Frontend routes: `/`, `/dashboard`, `/expenses`, etc.
- API routes: `/api/*` and `/api/auth/*`
- All served from the same host and port.

## API Routing Rules

- All backend routes remain under `/api/*`
- Frontend API calls use relative `/api` base URL
- No absolute API URLs are required in production

## Test Import (CSV and Excel)

Admins can create tests by importing question banks from `.csv` or `.xlsx` files.

- UI path: Admin Dashboard -> Overview -> Create Test / Import CSV or Excel
- If a file is selected, clicking Create Test imports questions and creates one draft test.
- If no file is selected, clicking Create Test creates an empty draft test.

Supported question columns (header names are matched flexibly):

- `Question` or `QuestionTitle` or `Title`
- `Explanation` or `QuestionDescription` or `Description`
- `OptionA`, `OptionB`, `OptionC`, `OptionD`
- `CorrectAnswer` or `CorrectAnswers` (single: `A`, multi: `A|C`)
- Optional: `Marks`, `NegativeMarks`, `AllowMultiple`

Import validation rules:

- Question title required
- Minimum two options required
- At least one correct answer required
- Correct answer values must match present option keys (`A`, `B`, `C`, `D`)

Backend endpoints:

- `POST /api/tests/import/file` for multipart file upload (`file`, `title`, `durationMinutes`, etc.)
- `POST /api/tests/import/csv` for legacy raw CSV text payload support

## Express Static + SPA Fallback

Implemented in `server/src/app.js`:
- Serve static assets from `client/dist`
- Return `client/dist/index.html` for non-API routes
- Keep API 404/error handling for `/api/*`

## Environment Strategy

Use one root `.env` as source of truth for backend runtime and local dev proxy defaults.
Vite is configured with `envDir` pointing to repository root, so `client/.env` is not required.
Backend env loader reads from root `.env` only.

Important:
- Use only root `.env` and root `.env.example`.
- Do not create or maintain `server/.env` or `server/.env.example`.

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
- Build command: `npm run render-build`
- Start command: `npm start`
- Health check: `/api/health`

Set environment variables in Render dashboard (or environment groups), matching `.env.example`.

## Railway / VPS / Azure App Service

Use the same root commands:
- Build command: `npm run build`
- Start command: `npm start`

Only expose the backend runtime port (`PORT`, default `5000`).
Do not deploy frontend and backend as separate services.

## Netlify Note

This architecture is intentionally optimized for Node-first hosts (Render, Railway, VPS, Azure App Service, Docker) where one Express process serves both frontend and backend. Netlify is frontend-first and is not the target deployment model for this unified backend-serving setup.

## Migration Notes

This consolidation keeps `client/` + `server/` as the active production stack and removes duplicate legacy folder structure after runtime/build validation.
