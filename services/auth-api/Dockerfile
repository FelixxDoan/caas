FROM node:20-alpine AS deps
WORKDIR /app
COPY services/auth-api/package.json pnpm-lock.yaml* package-lock.json* ./
RUN corepack enable || true
RUN pnpm i --prod --frozen-lockfile

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY services/auth-api/src ./src
EXPOSE 4000
CMD ["node","src/index.js"]
