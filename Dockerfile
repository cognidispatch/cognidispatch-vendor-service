FROM node:20-alpine AS builder
WORKDIR /app

COPY shared/ /app/shared/
RUN cd /app/shared && npm install --omit=dev

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk update && apk upgrade --no-cache

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=builder /app/shared /app/shared
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/. /app/

RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

USER node

EXPOSE 5000

CMD ["node", "server.js"]
