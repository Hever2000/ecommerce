FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copiamos directamente tu carpeta compilada local
COPY dist ./dist
COPY package*.json ./
COPY prisma ./prisma

# Instalamos TODAS las dependencias (necesitamos prisma CLI para generate)
RUN npm ci
RUN npm prune --production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/main"]

