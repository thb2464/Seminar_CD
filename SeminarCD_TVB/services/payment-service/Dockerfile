FROM node:20-alpine AS builder

WORKDIR /srv/app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN npm run build && npm prune --omit=dev


FROM node:20-alpine AS runtime

WORKDIR /srv/app

ENV NODE_ENV=production \
    PORT=3003

RUN apk add --no-cache curl

COPY --from=builder /srv/app/node_modules ./node_modules
COPY --from=builder /srv/app/dist ./dist
COPY --from=builder /srv/app/package.json ./

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:3003/ || exit 1

CMD ["node", "dist/main.js"]
