FROM node:20-alpine AS build

RUN apk add --no-cache build-base gcc g++ make python3

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm rebuild

COPY . .
RUN npm run build


FROM node:20-alpine AS production

RUN apk add --no-cache vips-dev curl

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm rebuild

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/favicon.png ./favicon.png
COPY ./config ./config
COPY ./database ./database
COPY ./src ./src

EXPOSE 1337

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:1337/_health || exit 1

CMD ["npm", "run", "start"]
