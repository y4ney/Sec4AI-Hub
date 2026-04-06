# ═══════════════════════════════════════════════════════════════
# Sec4AI Hub — Multi-stage Dockerfile
# CIS Docker Benchmark compliant
# ═══════════════════════════════════════════════════════════════

# ── Stage 1: Build ────────────────────────────────────────────
FROM node:22-alpine3.21 AS build

# hadolint ignore=DL3018
RUN apk add --no-cache tini

WORKDIR /build

# Install dependencies first (layer cache)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and generate content
COPY gen-index.mjs ./
COPY wiki/ ./wiki/
COPY tsconfig.json ./
COPY index.html ./
COPY src/ ./src/
COPY public/ ./public/
COPY vite.config.ts ./

# Generate index, build production bundle (Vite plugin copies wiki to dist/)
RUN node gen-index.mjs \
    && npm run build \
    && cp dist/index.html dist/404.html

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM nginxinc/nginx-unprivileged:1.28-alpine3.21

# CIS: Fix CVE-2025-0322, keep image minimal
# hadolint ignore=DL3018
RUN apk update --no-cache && apk upgrade --no-cache \
    && rm -rf /var/cache/apk/*

# CIS: Custom nginx config — no server tokens, security headers
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf

# CIS: Copy built assets as non-root (UID 101)
COPY --from=build --chown=101:101 /build/dist /usr/share/nginx/html

# CIS: Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -fsS http://localhost:8080/ || exit 1

# CIS: Run as non-root (nginx-unprivileged default: UID 101)
USER 101

EXPOSE 8080

ENTRYPOINT ["nginx", "-g", "daemon off;"]
