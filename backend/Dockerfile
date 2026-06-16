# --- ETAPA 1: Compilación ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src/ ./src/
COPY prisma/ ./prisma/

# Generamos el cliente de Prisma y compilamos NestJS
RUN npx prisma generate
RUN npm run build

# --- ETAPA 2: Producción ---
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache curl

ENV NODE_ENV=production

# Copiamos código compilado y archivos necesarios de Prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Instalamos SOLAMENTE las dependencias de producción para ahorrar espacio
COPY package*.json ./
RUN npm ci --only=production

# Volvemos a generar Prisma Client para que apunte a los node_modules limpios
RUN npx prisma generate

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/main"]
