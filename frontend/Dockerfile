FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=3001

# Copiamos directamente las carpetas generadas localmente por Next.js
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/ || exit 1

CMD ["node", "server.js"]

