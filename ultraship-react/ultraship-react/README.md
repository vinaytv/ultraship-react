# Ultraship React Frontend

Vite + React app with Apollo Client for the Ultraship backend.

## Getting Started

```bash
npm install
npm run dev
```

Frontend dev server: http://localhost:5173 (proxied to backend at http://localhost:8080 for `/graphql` and `/api`).

## Production Build

```bash
npm run build
```

Artifacts are output to `dist/`.

## Docker

```bash
docker build -t ultraship-react .
docker run -p 8080:3000 ultraship-react
```

The image builds the app and serves `dist` with a Node static server. It reads `PORT` (default 3000), so platforms like Railway/Render/Heroku work when they inject `PORT`.

## Config

- `VITE_API_BASE_URL`: set to your backend base (e.g., `https://ultraship-backend-4.onrender.com`). If unset, frontend calls relative `/graphql` and `/api/...`.
