FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl openssl1.1-compat

ENV NODE_ENV=production

# Copiamos directamente tu carpeta compilada local
COPY dist ./dist
COPY package*.json ./
COPY prisma ./prisma

# Instalamos TODAS las dependencias (necesitamos prisma CLI para generate)
RUN npm ci
RUN npx prisma generate
RUN npm prune --production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/main"]

