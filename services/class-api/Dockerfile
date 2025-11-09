FROM node:20-alpine AS deps
WORKDIR /app
COPY services/user-api/package.json pnpm-lock.yaml* package-lock.json* ./
RUN corepack enable || true
RUN pnpm i --prod --frozen-lockfile

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY services/user-api/src ./src
EXPOSE 3000
CMD ["node","src/index.js"]
