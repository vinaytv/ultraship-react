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
docker run -p 8080:80 ultraship-react
```

The image builds the app and serves `dist` via nginx on port 80.
