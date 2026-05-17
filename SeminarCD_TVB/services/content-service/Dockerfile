FROM node:20-alpine

# Native deps Strapi/sharp need + curl for healthcheck
RUN apk add --no-cache build-base gcc g++ make python3 vips-dev curl

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm rebuild

COPY . .
RUN npm run build

EXPOSE 1337

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:1337/_health || exit 1

CMD ["npm", "run", "start"]
