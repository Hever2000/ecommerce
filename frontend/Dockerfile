
# --- ETAPA 1: Compilación ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copiamos todos los archivos de configuración y código fuente
COPY next.config.js ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY public/ ./public/
COPY src/ ./src/

# Next.js requiere esta variable en build-time para optimizar el empaquetado
ENV NEXT_PRIVATE_STANDALONE=true
RUN npm run build

# --- ETAPA 2: Producción ---
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=3001

# Copiamos los artefactos generados por el builder standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/ || exit 1

# En modo standalone, Next.js arranca ejecutando server.js
CMD ["node", "server.js"]

