# ──────────────────────────────────────────────────
# CogniDispatch Backend Microservice — Multi-Stage Dockerfile
# ──────────────────────────────────────────────────

# Stage 1: Install dependencies
FROM node:20-alpine AS builder
WORKDIR /app

# Install shared library first (local dependency)
COPY shared/ /app/shared/
RUN cd /app/shared && npm install --omit=dev

# Install service dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy all service source files
COPY . .

# Stage 2: Clean production runner
FROM node:20-alpine AS runner
WORKDIR /app

# Upgrade OS packages to patch known vulnerabilities
RUN apk update && apk upgrade --no-cache

ENV NODE_ENV=production
ENV PORT=5000

# Copy shared library and service from builder
COPY --from=builder /app/shared /app/shared
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/. /app/

# Remove npm/npx to eliminate bundled vuln surface
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# Use non-root user for security
USER node

EXPOSE 5000

CMD ["node", "server.js"]
