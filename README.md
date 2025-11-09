# Micro Repo (Node.js, JS) — Dockerized Dev & Prod

## Dev
```bash
corepack enable || true
pnpm --version
pnpm dev
```
Then open:
- Auth API: http://localhost:4000/healthz
- User API: http://localhost:3000/healthz

## Prod build (single service)
```bash
docker build -t auth-api:prod -f services/auth-api/Dockerfile .
docker run --rm -p 4000:4000 -e PORT=4000 -e JWT_SECRET=devsecret auth-api:prod
```
